require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Confirmed as parkingapp_data
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
    // Queries the 'users' table we created inside the Docker container
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/clients", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM People");
    
    // Mapping SQL names (First, Last, PeopleID) to keys used in JSX
    const formattedPeople = rows.map(person => ({
      id: person.PeopleID,
      firstName: person.First,
      lastName: person.Last,
      permitNumber: person['Permit #'],
      email: person.EmailAddr,
      phone: person['Cell Phone'] || person['Home Phone'] || "N/A",
      type: person['Client Type'],
      company: person.Company,
      status: person.Status
    }));

    res.json(formattedPeople);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CARS (Updated for 'Cars' table mapping) ---
app.get("/cars", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Cars");
    
    // Mapping messy SQL column names to clean JS keys for the frontend
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

// --- PAYMENTS (Updated for your specific column names) ---
app.get("/payments", async (req, res) => {
  try {
    // Note: Use backticks for columns with spaces
    const [rows] = await pool.query("SELECT ID, Payer, `Payment Month`, `Payment Amount`, AddedTS, AddedBy FROM Payments LIMIT 1000");
    
    const formatted = rows.map(p => ({
      id: p.ID,
      payer: p.Payer,
      month: p['Payment Month'],
      // Convert the varchar string "100.00" to a real number for the frontend
      amount: parseFloat(p['Payment Amount']) || 0, 
      created_at: p.AddedTS,
      added_by: p.AddedBy,
      is_paid: true 
    }));

    res.json(formatted);
  } catch (err) { 
    console.error("Payments Query Error:", err.message);
    res.status(500).json({ error: "Failed to fetch payments" }); 
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Connected to database: ${dbConfig.database}`);
});