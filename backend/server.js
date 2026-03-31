require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role });
  } catch (err) { res.status(500).json({ error: "Database error" }); }
});

// --- CLIENTS ---
app.get("/clients", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM People ORDER BY Last ASC");
    const formattedPeople = rows.map(person => ({
      id: person.PeopleID,
      firstName: person.First,
      lastName: person.Last,
      address: person.Address,
      city: person.City,
      state: person.ST,
      zip: person.zip,
      phone: person['Cell Phone'] || person['Home Phone'] || "N/A",
      permitNumber: person['Permit #'],
      feeCharged: person['Fee Charged'],
      email: person.EmailAddr,
      company: person.Company,
      status: person.Status,
      ccNum: person.CreditCardNum,
      ccExp: person.CreditCardExpDate,
      paymentType: person['Payment Type'],
      type: person['Client Type']
    }));
    res.json(formattedPeople);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/clients", async (req, res) => {
  // CAPTURE ALL 16 INCOMING VARIABLES 
  const { firstName, lastName, address, city, state, zip, phone, permitNumber, feeCharged, email, company, status, type, ccNum, ccExp, addedBy } = req.body;
  try {
    // Variable count matches the 16 placeholders + NOW() for a total of 17 columns
    const [result] = await pool.query(
      `INSERT INTO People (First, Last, Address, City, ST, zip, \`Cell Phone\`, \`Permit #\`, \`Fee Charged\`, EmailAddr, Company, Status, \`Client Type\`, CreditCardNum, CreditCardExpDate, AddedBy, AddedTS) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [firstName, lastName, address, city, state, zip, phone, permitNumber, feeCharged, email, company, status || 'active', type || 'tenant', ccNum, ccExp, addedBy]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { 
    console.error("Client Creation Error:", err);
    res.status(500).json({ error: err.message }); 
  }
});

app.put("/clients/:id", async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, address, city, state, zip, phone, permitNumber, feeCharged, email, company, status, type, ccNum, ccExp } = req.body;
  try {
    await pool.query(
      `UPDATE People SET First = ?, Last = ?, Address = ?, City = ?, ST = ?, zip = ?, \`Cell Phone\` = ?, \`Permit #\` = ?, \`Fee Charged\` = ?, EmailAddr = ?, Company = ?, Status = ?, \`Client Type\` = ?, CreditCardNum = ?, CreditCardExpDate = ? WHERE PeopleID = ?`,
      [firstName, lastName, address, city, state, zip, phone, permitNumber, feeCharged, email, company, status, type, ccNum, ccExp, id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CARS (VEHICLES) ---
app.get("/cars", async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT c.*, p.First as ownerFirst, p.Last as ownerLast FROM Cars c LEFT JOIN People p ON c.Owner = p.PeopleID`);
    const formattedCars = rows.map(car => ({
      id: car['Car ID#'], make: car['Car Make'], model: car.Model, color: car.Color, year: car.Year, license_plate: car.License, owner_id: car.Owner, owner_first: car.ownerFirst, owner_last: car.ownerLast
    }));
    res.json(formattedCars);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/cars", async (req, res) => {
  const { make, model, color, year, license_plate, owner_id, addedBy } = req.body;
  try {
    const [result] = await pool.query(`INSERT INTO Cars (\`Car Make\`, Model, Color, Year, License, Owner, AddedBy, AddedTS) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`, [make, model, color, year, license_plate, owner_id, addedBy || 'Admin']);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/cars/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Cars WHERE `Car ID#` = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DAILY PERMITS ---
app.get("/permits", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM DailyPermit ORDER BY AddedTS DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/permits", async (req, res) => {
  const { user_name, start_date, end_date, added_by, permit_number } = req.body;
  try {
    const shortAddedBy = (added_by || 'ADM').substring(0, 3).toUpperCase();
    const manualID = Math.floor(100000 + Math.random() * 900000);
    const [result] = await pool.query(
      "INSERT INTO DailyPermit (TempPermitID, UserName, PermitDate, PermitStartDate, PermitEndDate, AddedBy, AddedTS) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [manualID, user_name, permit_number, start_date, end_date, shortAddedBy]
    );
    res.json({ success: true, id: manualID });
  } catch (err) { 
    console.error("Permit Creation Error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

app.delete("/permits/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM DailyPermit WHERE TempPermitID = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ success: true });
  } catch (err) { 
    console.error("Delete Error:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// --- PAYMENTS & MASS PAYMENTS ---
app.get("/mass-payments-log", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM MassPaymentsLog ORDER BY DateProcessed DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/process-mass-payment", async (req, res) => {
  const { month, clients, addedBy } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("INSERT INTO MassPaymentsLog (MonthProcessed, DateProcessed, AddedBy) VALUES (?, NOW(), ?)", [month, addedBy || 'Admin']);
    for (const client of clients) {
      await connection.query("INSERT INTO Payments (Payer, `Payment Month`, `Payment Amount`, AddedTS, AddedBy) VALUES (?, ?, ?, NOW(), ?)", [client.id, month, client.feeCharged || "120", addedBy || 'Admin']);
    }
    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { connection.release(); }
});

app.get("/payments", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Payments ORDER BY AddedTS DESC");
    const formatted = rows.map(p => ({
      id: p.ID, payer: p.Payer, month: p['Payment Month'], amount: parseFloat(p['Payment Amount']) || 0, created_at: p.AddedTS, added_by: p.AddedBy
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: "Failed to fetch payments" }); }
});

app.listen(PORT, () => { console.log(`🚀 Server running on port ${PORT}`); });