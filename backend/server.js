// require('dotenv').config();
// const express = require("express");
// const cors = require("cors");
// const mysql = require("mysql2/promise");

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MySQL Connection Pool
// const dbConfig = {
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   charset: "utf8mb4"
// }

// const pool = mysql.createPool(dbConfig);

// // Initialize database tables
// async function initializeDatabase() {
//   try {
//     console.log("MySQL Tables Initialized Successfully");
//     // await seedDatabase();
//   } catch (err) {
//     console.error("Database initialization error:", err);
//     process.exit(1);
//   }
// }

// // --- AUTH ---
// app.post("/auth/login", async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
//     if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
//     res.json({ id: rows[0].id, username: rows[0].username, role: rows[0].role });
//   } catch (err) {
//     res.status(500).json({ error: "Database error" });
//   }
// });

// // --- CLIENTS ---
// app.get("/clients", async (req, res) => {
//   const today = new Date().toISOString().split("T")[0];
//   try {
//     const [rows] = await pool.query(`
//       SELECT c.*, MAX(CASE WHEN p.end_date >= ? THEN 1 ELSE 0 END) as has_active_permit
//       FROM clients c LEFT JOIN cars car ON c.id = car.client_id
//       LEFT JOIN permits p ON car.id = p.car_id GROUP BY c.id ORDER BY c.first_name`, [today]);
//     res.json(rows);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.post("/clients", async (req, res) => {
//   const { first_name, last_name, email, phone, client_type } = req.body;
//   try {
//     const [result] = await pool.query(
//       "INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)",
//       [first_name, last_name, email, phone, client_type || 'temp']
//     );
//     res.json({ id: result.insertId, ...req.body });
//   } catch (err) { res.status(500).json({ error: "Failed to create client" }); }
// });

// app.patch("/clients/:id/toggle-active", async (req, res) => {
//   try {
//     await pool.query("UPDATE clients SET active = ? WHERE id = ?", [req.body.active ? 1 : 0, req.params.id]);
//     res.json({ success: true });
//   } catch (err) { res.status(500).json({ error: "Failed" }); }
// });

// // --- CARS ---
// app.get("/cars", async (req, res) => {
//   const today = new Date().toISOString().split("T")[0];
//   try {
//     const [rows] = await pool.query(`
//       SELECT c.*, cl.first_name, cl.last_name,
//       (SELECT COUNT(*) FROM payments p WHERE p.client_id = c.client_id AND p.is_paid = 0) as outstanding_payments,
//       (SELECT COUNT(*) FROM permits p WHERE p.car_id = c.id AND p.end_date >= ?) as has_active_permit
//       FROM cars c JOIN clients cl ON c.client_id = cl.id`, [today]);
//     res.json(rows);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // --- PERMITS ---
// app.get("/permits", async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT p.*, c.license_plate, cl.first_name, cl.last_name FROM permits p 
//       JOIN cars c ON p.car_id = c.id JOIN clients cl ON c.client_id = cl.id ORDER BY p.created_at DESC`);
//     res.json(rows);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.post("/permits", async (req, res) => {
//   const { permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost } = req.body;
//   try {
//     const [result] = await pool.query(
//       "INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
//       [permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost]
//     );
//     res.json({ id: result.insertId, ...req.body });
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // --- PAYMENTS & BILLING ---
// app.get("/payments", async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT pay.*, cl.first_name, cl.last_name, p.permit_number 
//       FROM payments pay 
//       JOIN clients cl ON pay.client_id = cl.id 
//       JOIN permits p ON pay.permit_id = p.id
//       ORDER BY pay.created_at DESC`);
//     res.json(rows);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// app.patch("/payments/:id", async (req, res) => {
//   const { is_paid } = req.body;
//   const paid_date = is_paid ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
//   try {
//     await pool.query("UPDATE payments SET is_paid = ?, paid_date = ? WHERE id = ?", [is_paid ? 1 : 0, paid_date, req.params.id]);
//     res.json({ success: true });
//   } catch (err) { res.status(500).json({ error: "Failed to update payment" }); }
// });

// app.post("/payments/generate-monthly", async (req, res) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     const [monthlyPermits] = await connection.query("SELECT * FROM permits WHERE permit_type = 'monthly' AND active = 1");
//     for (const permit of monthlyPermits) {
//       await connection.query("INSERT INTO payments (permit_id, client_id, amount, is_paid) VALUES (?, ?, ?, 0)", [permit.id, permit.client_id, permit.total_cost]);
//       await connection.query("UPDATE permits SET end_date = DATE_ADD(end_date, INTERVAL 1 MONTH) WHERE id = ?", [permit.id]);
//     }
//     await connection.commit();
//     res.json({ message: `Generated ${monthlyPermits.length} invoices.` });
//   } catch (err) {
//     await connection.rollback();
//     res.status(500).json({ error: err.message });
//   } finally { connection.release(); }
// });

// app.delete("/payments/:id", async (req, res) => {
//   try {
//     await pool.query("DELETE FROM payments WHERE id = ?", [req.params.id]);
//     res.json({ success: true });
//   } catch (err) { res.status(500).json({ error: "Failed to delete payment" }); }
// });

// // --- REPORTS ---
// app.get("/reports", async (req, res) => {
//   try {
//     const [rows] = await pool.query(`
//       SELECT cl.id, cl.first_name, cl.last_name, SUM(pay.amount) as total_paid 
//       FROM clients cl LEFT JOIN payments pay ON cl.id = pay.client_id GROUP BY cl.id`);
//     res.json(rows);
//   } catch (err) { res.status(500).json({ error: err.message }); }
// });

// // Initialize and Start
// initializeDatabase().then(() => {
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// });


require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const fs = require('fs').promises;
const path = require('path');

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
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
}

const pool = mysql.createPool(dbConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    /* KEEPING THESE COMMENTED PER YOUR REQUEST:
       We are now relying on data.sql as the initial source of truth.
    */
    
    // // Users table
    // await pool.query(`CREATE TABLE IF NOT EXISTS users (
    //   id INT AUTO_INCREMENT PRIMARY KEY,
    //   username VARCHAR(255) UNIQUE NOT NULL,
    //   password VARCHAR(255) NOT NULL,
    //   role ENUM('admin', 'front_desk', 'read_only') NOT NULL,
    //   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    // )`);

    // ... (rest of your commented table blocks)

    console.log("Database connection established. Checking for seed data...");
    await seedDatabaseFromSQL();
  } catch (err) {
    console.error("Database initialization error:", err);
    process.exit(1);
  }
}

/**
 * SEED DATABASE FROM SQL FILE
 * This function reads data.sql and executes the queries.
 * It only runs if it detects an empty database.
 */
async function seedDatabaseFromSQL() {
  try {
    // Check if a baseline table (like 'users') exists and has data
    // We use a try/catch here in case the table hasn't even been created yet
    let seeded = false;
    try {
      const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
      if (rows[0].count > 0) seeded = true;
    } catch (e) {
      // If table doesn't exist, we definitely need to seed
      seeded = false;
    }

    if (seeded) {
      console.log("Database already initialized. Persisting from MySQL volume.");
      return;
    }

    const sqlPath = path.join(__dirname, 'data.sql');
    const sqlFileContent = await fs.readFile(sqlPath, 'utf8');

    // Split by semicolon and execute each statement
    const queries = sqlFileContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`Executing ${queries.length} initialization queries from data.sql...`);

    for (const query of queries) {
      await pool.query(query);
    }

    console.log("Database successfully initialized from data.sql.");
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn("data.sql not found. Ensure it is uploaded to the backend directory.");
    } else {
      console.error("Error during SQL seeding:", err);
    }
  }
}

// --- AUTH ---
app.post("/auth/login", async (req, res) => {
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
app.get("/clients", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  try {
    const [rows] = await pool.query(`
      SELECT c.*, MAX(CASE WHEN p.end_date >= ? THEN 1 ELSE 0 END) as has_active_permit
      FROM clients c LEFT JOIN cars car ON c.id = car.client_id
      LEFT JOIN permits p ON car.id = p.car_id GROUP BY c.id ORDER BY c.first_name`, [today]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/clients", async (req, res) => {
  const { first_name, last_name, email, phone, client_type } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)",
      [first_name, last_name, email, phone, client_type || 'temp']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: "Failed to create client" }); }
});

app.patch("/clients/:id/toggle-active", async (req, res) => {
  try {
    await pool.query("UPDATE clients SET active = ? WHERE id = ?", [req.body.active ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// --- CARS ---
app.get("/cars", async (req, res) => {
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
app.get("/permits", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, c.license_plate, cl.first_name, cl.last_name FROM permits p 
      JOIN cars c ON p.car_id = c.id JOIN clients cl ON c.client_id = cl.id ORDER BY p.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/permits", async (req, res) => {
  const { permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENTS & BILLING ---
app.get("/payments", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pay.*, cl.first_name, cl.last_name, p.permit_number 
      FROM payments pay 
      JOIN clients cl ON pay.client_id = cl.id 
      JOIN permits p ON pay.permit_id = p.id
      ORDER BY pay.created_at DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/payments/:id", async (req, res) => {
  const { is_paid } = req.body;
  const paid_date = is_paid ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
  try {
    await pool.query("UPDATE payments SET is_paid = ?, paid_date = ? WHERE id = ?", [is_paid ? 1 : 0, paid_date, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to update payment" }); }
});

app.post("/payments/generate-monthly", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [monthlyPermits] = await connection.query("SELECT * FROM permits WHERE permit_type = 'monthly' AND active = 1");
    for (const permit of monthlyPermits) {
      await connection.query("INSERT INTO payments (permit_id, client_id, amount, is_paid) VALUES (?, ?, ?, 0)", [permit.id, permit.client_id, permit.total_cost]);
      await connection.query("UPDATE permits SET end_date = DATE_ADD(end_date, INTERVAL 1 MONTH) WHERE id = ?", [permit.id]);
    }
    await connection.commit();
    res.json({ message: `Generated ${monthlyPermits.length} invoices.` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally { connection.release(); }
});

app.delete("/payments/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM payments WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete payment" }); }
});

// --- REPORTS ---
app.get("/reports", async (req, res) => {
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