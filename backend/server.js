require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql"); // Switched to mysql

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool Setup
const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'user_artie',
  password: process.env.DB_PASSWORD || 'parking_password',
  database: process.env.DB_NAME || 'parking_system'
});

// Initialize database tables
function initializeDatabase() {
    // Users table
    db.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'front_desk', 'read_only') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error(err); });

    // Clients table
    db.query(`CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      client_type ENUM('employee', 'temp') NOT NULL DEFAULT 'temp',
      active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`, (err) => { if (err) console.error(err); });

    // Cars table
    db.query(`CREATE TABLE IF NOT EXISTS cars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      license_plate VARCHAR(50) UNIQUE NOT NULL,
      make VARCHAR(100) NOT NULL,
      model VARCHAR(100) NOT NULL,
      color VARCHAR(50),
      year INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`, (err) => { if (err) console.error(err); });

    // Permits table
    db.query(`CREATE TABLE IF NOT EXISTS permits (
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(car_id) REFERENCES cars(id) ON DELETE CASCADE
    )`, (err) => { if (err) console.error(err); });

    // Payments table
    db.query(`CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      permit_id INT NOT NULL,
      client_id INT NOT NULL,
      amount DOUBLE NOT NULL,
      is_paid BOOLEAN DEFAULT 0,
      paid_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY(permit_id) REFERENCES permits(id) ON DELETE CASCADE,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    )`, (err) => { 
        if (err) console.error(err);
        else seedDatabase(); 
    });
}

function seedDatabase() {
  db.query("SELECT COUNT(*) as count FROM users", (err, rows) => {
    if (err || !rows) return;
    if (rows[0].count === 0) {
      console.log("Seeding extensive database...");
      
      const users = [
        ["artie", "2020", "admin"],
        ["frontdesk", "1234", "front_desk"]
      ];
      users.forEach(u => db.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", u));

      const clients = [
        ["James", "Wilson", "james@tech.com", "555-0101", "employee"],
        ["Sarah", "Martinez", "sarah@finance.com", "555-0102", "employee"],
        ["Test", "Subject", "test@monthly.com", "555-9999", "employee"]
      ];
      clients.forEach(c => db.query("INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)", c));

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nextMonth = new Date(new Date().setMonth(now.getMonth() + 1)).toISOString().split('T')[0];

      db.query("INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["PMT-TEST-100", 1, "monthly", today, nextMonth, 150, 150]); 
    }
  });
}

// Auth
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: results[0].id, username: results[0].username, role: results[0].role });
  });
});

// --- DELETE ENDPOINTS ---
app.delete("/api/clients/:id", (req, res) => {
    db.query("DELETE FROM clients WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete("/api/cars/:id", (req, res) => {
    db.query("DELETE FROM cars WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete("/api/permits/:id", (req, res) => {
    db.query("DELETE FROM permits WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.delete("/api/payments/:id", (req, res) => {
    db.query("DELETE FROM payments WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- STANDARD ENDPOINTS ---
app.get("/api/clients", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const query = `
    SELECT c.*, MAX(CASE WHEN p.end_date >= ? THEN 1 ELSE 0 END) as has_active_permit
    FROM clients c LEFT JOIN cars car ON c.id = car.client_id
    LEFT JOIN permits p ON car.id = p.car_id GROUP BY c.id ORDER BY c.first_name`;
  db.query(query, [today], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/clients/:id", (req, res) => {
  db.query("SELECT * FROM clients WHERE id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
  });
});

app.post("/api/clients", (req, res) => {
  const { first_name, last_name, email, phone, client_type } = req.body;
  db.query("INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)",
    [first_name, last_name, email, phone, client_type || 'temp'], (err, result) => {
      if (err) return res.status(500).json({ error: "Failed" });
      res.json({ id: result.insertId, ...req.body });
    });
});

app.patch("/api/clients/:id/toggle-active", (req, res) => {
    db.query("UPDATE clients SET active = ? WHERE id = ?", [req.body.active ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed" });
        res.json({ success: true });
    });
});

app.get("/api/cars", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  db.query(`SELECT c.*, cl.first_name, cl.last_name FROM cars c JOIN clients cl ON c.client_id = cl.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/permits", (req, res) => {
  db.query(`SELECT p.*, c.license_plate, cl.first_name, cl.last_name FROM permits p 
            JOIN cars c ON p.car_id = c.id JOIN clients cl ON c.client_id = cl.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/permits", (req, res) => {
  const { permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost } = req.body;
  db.query("INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, ...req.body });
    });
});

app.get("/api/payments", (req, res) => {
  db.query(`SELECT p.*, cl.first_name, cl.last_name FROM payments p JOIN clients cl ON p.client_id = cl.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/reports", (req, res) => {
  db.query(`SELECT cl.id, cl.first_name, cl.last_name, SUM(pay.amount) as total_paid 
            FROM clients cl LEFT JOIN payments pay ON cl.id = pay.client_id GROUP BY cl.id`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Initialize and Start
initializeDatabase();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});