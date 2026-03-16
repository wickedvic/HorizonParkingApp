require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Should be parkingapp_data
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
};

const pool = mysql.createPool(dbConfig);

// --- AUTH ---
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    // Points to the 'users' table we manually created in Docker
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- CARS (Updated for your SQL Dump) ---
app.get("/cars", async (req, res) => {
  try {
    // Note: We use 'Cars' (Capitalized) and map the weird column names to clean JS names
    const [rows] = await pool.query("SELECT * FROM Cars");
    
    const formattedCars = rows.map(car => ({
      id: car['Car ID#'],
      make: car['Car Make'],
      model: car.Model,
      color: car.Color,
      year: car.Year,
      license_plate: car.License,
      state: car['License State'],
      owner_id: car.Owner
    }));

    res.json(formattedCars);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post("/cars", async (req, res) => {
  const { make, model, color, year, license_plate, state, owner_id } = req.body;
  try {
    // Using backticks for columns with spaces
    const [result] = await pool.query(
      "INSERT INTO Cars (`Car Make`, Model, Color, Year, License, `License State`, Owner) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [make, model, color, year, license_plate, state, owner_id]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// --- PERMITS (Updated for 'DailyPermit' table) ---
app.get("/permits", async (req, res) => {
  try {
    // Points to 'DailyPermit' from your dump
    const [rows] = await pool.query("SELECT * FROM DailyPermit ORDER BY AddedTS DESC");
    res.json(rows);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post("/permits", async (req, res) => {
  const { user_name, start_date, end_date, added_by } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO DailyPermit (UserName, PermitStartDate, PermitEndDate, AddedBy, AddedTS) VALUES (?, ?, ?, ?, NOW())",
      [user_name, start_date, end_date, added_by]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// --- PAYMENTS (Placeholder as your dump used a different structure) ---
app.get("/payments", async (req, res) => {
  try {
    // Your dump has 'Payments' (Capitalized)
    const [rows] = await pool.query("SELECT * FROM Payments LIMIT 50");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Connected to database: ${dbConfig.database}`);
});