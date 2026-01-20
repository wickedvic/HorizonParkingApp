require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // Using mysql2 for better Docker stability

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
// These variables match the ones we set in your Docker Compose file
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'parkingapp_user',
  password: process.env.DB_PASSWORD || 'strong_app_password',
  database: process.env.DB_NAME || 'parkingapp_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'front_desk', 'read_only') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Clients table
    await pool.query(`CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      client_type ENUM('employee', 'temp') NOT NULL DEFAULT 'temp',
      active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    // Cars table
    await pool.query(`CREATE TABLE IF NOT EXISTS cars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      license_plate VARCHAR(50) UNIQUE NOT NULL,
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      color VARCHAR(50),
      year INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`);

    // Permits table
    await pool.query(`CREATE TABLE IF NOT EXISTS permits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      permit_number VARCHAR(100) UNIQUE NOT NULL,
      car_id INT NOT NULL,
      permit_type ENUM('daily', 'monthly', 'custom') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      daily_rate DOUBLE NOT NULL,
      total_cost DOUBLE NOT NULL,
      active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    )`);

    // Payments table
    await pool.query(`CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      permit_id INT NOT NULL,
      client_id INT NOT NULL,
      amount DOUBLE NOT NULL,
      is_paid BOOLEAN DEFAULT 0,
      paid_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (permit_id) REFERENCES permits(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`);

    console.log("MySQL Tables Initialized Successfully");
    await seedDatabase();
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

async function seedDatabase() {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
    if (rows[0].count === 0) {
      console.log("Seeding initial users...");
      await pool.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?), (?, ?, ?)", 
        ["artie", "2020", "admin", "frontdesk", "1234", "front_desk"]);
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

// --- AUTH ---
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- CLIENTS ---
app.get("/api/clients", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const [rows] = await pool.query(`
      SELECT c.*, MAX(CASE WHEN p.end_date >= ? THEN 1 ELSE 0 END) as has_active_permit
      FROM clients c LEFT JOIN cars car ON c.id = car.client_id
      LEFT JOIN permits p ON car.id = p.car_id GROUP BY c.id ORDER BY c.first_name`, [today]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/clients", async (req, res) => {
  const { first_name, last_name, email, phone, client_type } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, email, phone, client_type || 'temp']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: "Failed to create client" }); }
});

app.patch("/api/clients/:id/toggle-active", async (req, res) => {
  try {
    await pool.query("UPDATE clients SET active = ? WHERE id = ?", [req.body.active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// --- CARS ---
app.get("/api/cars", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const [rows] = await pool.query(`
      SELECT c.*, cl.first_name, cl.last_name,
      (SELECT COUNT(*) FROM payments p WHERE p.client_id = c.client_id AND p.is_paid = 0) as outstanding_payments,
      (SELECT COUNT(*) FROM permits p WHERE p.car_id = c.id AND p.end_date >= ?) as has_active_permit
      FROM cars c JOIN clients cl ON c.client_id = cl.id`, [today]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PERMITS ---
app.get("/api/permits", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.license_plate, cl.first_name, cl.last_name FROM permits p 
      JOIN cars c ON p.car_id = c.id JOIN clients cl ON c.client_id = cl.id ORDER BY p.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/permits", async (req, res) => {
  const { permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REPORTS ---
app.get("/api/reports", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT cl.id, cl.first_name, cl.last_name, SUM(pay.amount) as total_paid 
      FROM clients cl LEFT JOIN payments pay ON cl.id = pay.client_id GROUP BY cl.id`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Initialize and Start
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});