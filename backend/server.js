const express = require("express")
const cors = require("cors")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT

// Middleware
app.use(cors())
app.use(express.json())

// Database setup
const dbPath = path.join(__dirname, "parking.db")
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error:", err)
  else console.log("Connected to SQLite database")
})

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'front_desk', 'read_only')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    // Clients table - Added 'active' column
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      client_type TEXT CHECK(client_type IN ('employee', 'temp')) NOT NULL DEFAULT 'temp',
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    // Cars table
    db.run(`CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      license_plate TEXT UNIQUE NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT,
      year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )`)

    // Permits table
    db.run(`CREATE TABLE IF NOT EXISTS permits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_number TEXT UNIQUE NOT NULL,
      car_id INTEGER NOT NULL,
      permit_type TEXT CHECK(permit_type IN ('daily', 'monthly', 'custom')) NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      daily_rate REAL NOT NULL,
      total_cost REAL NOT NULL,
      active BOOLEAN DEFAULT 1, 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(car_id) REFERENCES cars(id)
    )`)

    // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permit_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      is_paid BOOLEAN DEFAULT 0,
      paid_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(permit_id) REFERENCES permits(id),
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )`)

    // Seed default data
    seedDatabase()
  })
}

function seedDatabase() {
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) return
    if (row.count === 0) {
      console.log("Seeding extensive database...")
      
      const users = [
        { username: "artie", password: "2020", role: "admin" },
        { username: "frontdesk", password: "1234", role: "front_desk" },
      ]
      users.forEach(u => db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [u.username, u.password, u.role]))

      const clients = [
        { f: "James", l: "Wilson", e: "james@tech.com", p: "555-0101", t: "employee" },
        { f: "Sarah", l: "Martinez", e: "sarah@finance.com", p: "555-0102", t: "employee" },
        { f: "Test", l: "Subject", e: "test@monthly.com", p: "555-9999", t: "employee" }
      ]
      clients.forEach(c => {
        db.run("INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)", [c.f, c.l, c.e, c.p, c.t])
      })

      const cars = [
        { cid: 1, p: "TECH001", m: "Tesla", mo: "Model S", c: "Silver", y: 2023 },
        { cid: 2, p: "FIN001", m: "BMW", mo: "3 Series", c: "Black", y: 2023 },
        { cid: 3, p: "TEST-GEN", m: "Toyota", mo: "Corolla", c: "Red", y: 2020 }
      ]
      cars.forEach(c => {
        db.run("INSERT INTO cars (client_id, license_plate, make, model, color, year) VALUES (?, ?, ?, ?, ?, ?)", [c.cid, c.p, c.m, c.mo, c.c, c.y])
      })

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nextMonth = new Date(new Date().setMonth(now.getMonth() + 1)).toISOString().split('T')[0];

      db.run("INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["PMT-TEST-100", 1, "monthly", today, nextMonth, 150, 150]); 
      
      db.run("INSERT INTO payments (permit_id, client_id, amount, is_paid, paid_date, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [1, 1, 150, 1, today, today]);
    }
  })
}

// Auth
app.post("/api/auth/login", (req, res) => {
  console.log("Login attempt:", req.body)

  const { username, password } = req.body
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: "Database error" })
    if (!user) return res.status(401).json({ error: "Invalid credentials" })
    res.json({ id: user.id, username: user.username, role: user.role })
  })
})

// --- DELETE ENDPOINTS ---

app.delete("/api/clients/:id", (req, res) => {
  const clientId = req.params.id;
  db.run("DELETE FROM payments WHERE client_id = ?", [clientId], (err) => {
    if (err) return res.status(500).json({ error: "Error deleting payments" });
    db.all("SELECT id FROM cars WHERE client_id = ?", [clientId], (err, cars) => {
        if (err) return res.status(500).json({ error: "Error finding cars" });
        const carIds = cars.map(c => c.id);
        if (carIds.length > 0) {
            const placeholders = carIds.map(() => '?').join(',');
            db.run(`DELETE FROM permits WHERE car_id IN (${placeholders})`, carIds, (err) => {
               if (err) return res.status(500).json({ error: "Error deleting permits" });
               db.run("DELETE FROM cars WHERE client_id = ?", [clientId], (err) => {
                   if (err) return res.status(500).json({ error: "Error deleting cars" });
                   db.run("DELETE FROM clients WHERE id = ?", [clientId], (err) => {
                       if (err) return res.status(500).json({ error: "Error deleting client" });
                       res.json({ success: true });
                   });
               });
            });
        } else {
            db.run("DELETE FROM clients WHERE id = ?", [clientId], (err) => {
               if (err) return res.status(500).json({ error: "Error deleting client" });
               res.json({ success: true });
            });
        }
    });
  });
});

app.delete("/api/cars/:id", (req, res) => {
    const carId = req.params.id;
    db.run("DELETE FROM permits WHERE car_id = ?", [carId], (err) => {
        if (err) return res.status(500).json({ error: "Error deleting permits" });
        db.run("DELETE FROM cars WHERE id = ?", [carId], (err) => {
            if (err) return res.status(500).json({ error: "Error deleting car" });
            res.json({ success: true });
        });
    });
});

app.delete("/api/permits/:id", (req, res) => {
    const permitId = req.params.id;
    db.run("DELETE FROM payments WHERE permit_id = ?", [permitId], (err) => {
        if (err) return res.status(500).json({ error: "Error deleting payments" });
        db.run("DELETE FROM permits WHERE id = ?", [permitId], (err) => {
            if (err) return res.status(500).json({ error: "Error deleting permit" });
            res.json({ success: true });
        });
    });
});

app.delete("/api/payments/:id", (req, res) => {
    db.run("DELETE FROM payments WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Error deleting payment" });
        res.json({ success: true });
    });
});

// --- STANDARD ENDPOINTS ---

app.get("/api/clients", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const query = `
    SELECT c.*, 
    MAX(CASE WHEN p.end_date >= ? THEN 1 ELSE 0 END) as has_active_permit
    FROM clients c
    LEFT JOIN cars car ON c.id = car.client_id
    LEFT JOIN permits p ON car.id = p.car_id
    GROUP BY c.id
    ORDER BY c.first_name
  `;
  db.all(query, [today], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(rows)
  })
})

app.get("/api/clients/:id", (req, res) => {
  db.get("SELECT * FROM clients WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "Database error" })
    if (!row) return res.status(404).json({ error: "Client not found" })
    res.json(row)
  })
})

app.post("/api/clients", (req, res) => {
  const { first_name, last_name, email, phone, client_type } = req.body
  db.run(
    "INSERT INTO clients (first_name, last_name, email, phone, client_type) VALUES (?, ?, ?, ?, ?)",
    [first_name, last_name, email, phone, client_type || 'temp'],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to create client" })
      res.json({ id: this.lastID, first_name, last_name, email, phone, client_type })
    },
  )
})

app.put("/api/clients/:id", (req, res) => {
  const { first_name, last_name, email, phone, client_type } = req.body
  db.run(
    "UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ?, client_type = ? WHERE id = ?",
    [first_name, last_name, email, phone, client_type, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to update client" })
      res.json({ success: true })
    }
  )
})

// New Endpoint: Toggle Client Active Status
app.patch("/api/clients/:id/toggle-active", (req, res) => {
    const { active } = req.body;
    db.run("UPDATE clients SET active = ? WHERE id = ?", [active ? 1 : 0, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update status" });
        res.json({ success: true });
    });
});

app.get("/api/cars", (req, res) => {
  const clientId = req.query.client_id
  const today = new Date().toISOString().split("T")[0];
  let query = `
    SELECT c.*, cl.first_name, cl.last_name,
    (SELECT COUNT(*) FROM payments p 
     WHERE p.client_id = c.client_id AND p.is_paid = 0) as outstanding_payments,
    (SELECT COUNT(*) FROM permits p 
     WHERE p.car_id = c.id AND p.end_date >= ?) as has_active_permit
    FROM cars c 
    JOIN clients cl ON c.client_id = cl.id 
  `
  const params = [today] 
  if (clientId) {
    query += ` WHERE c.client_id = ?`
    params.push(clientId)
  }
  query += ` ORDER BY c.license_plate`
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(rows)
  })
})

app.post("/api/cars", (req, res) => {
  const { client_id, license_plate, make, model, color, year } = req.body
  db.run(
    "INSERT INTO cars (client_id, license_plate, make, model, color, year) VALUES (?, ?, ?, ?, ?, ?)",
    [client_id, license_plate, make, model, color, year],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to create car" })
      res.json({ id: this.lastID, client_id, license_plate, make, model, color, year })
    },
  )
})

app.get("/api/permits", (req, res) => {
  const query = `
    SELECT p.*, c.license_plate, cl.first_name, cl.last_name, cl.active as client_active 
    FROM permits p 
    JOIN cars c ON p.car_id = c.id 
    JOIN clients cl ON c.client_id = cl.id 
    ORDER BY p.created_at DESC
  `
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(rows)
  })
})

app.post("/api/permits", (req, res) => {
  const { permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost } = req.body
  const initialPayment = permit_type === 'monthly' ? daily_rate : total_cost;

  db.run(
    "INSERT INTO permits (permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to create permit" })
      db.get("SELECT client_id FROM cars WHERE id = ?", [car_id], (err, car) => {
        if (car) {
          db.run("INSERT INTO payments (permit_id, client_id, amount, is_paid) VALUES (?, ?, ?, ?)", [
            this.lastID, car.client_id, initialPayment, 0
          ])
        }
        res.json({ id: this.lastID, permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost })
      })
    },
  )
})

app.get("/api/payments", (req, res) => {
  const query = `
    SELECT p.*, per.permit_number, per.total_cost, per.start_date, per.end_date, cl.first_name, cl.last_name 
    FROM payments p 
    JOIN permits per ON p.permit_id = per.id 
    JOIN clients cl ON p.client_id = cl.id 
    ORDER BY p.created_at DESC
  `
  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(rows)
  })
})

app.patch("/api/payments/:id", (req, res) => {
  const { is_paid, paid_date } = req.body
  db.run(
    "UPDATE payments SET is_paid = ?, paid_date = ? WHERE id = ?",
    [is_paid ? 1 : 0, is_paid ? paid_date || new Date().toISOString() : null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update payment" })
      res.json({ success: true })
    },
  )
})

// Monthly Payment Generation - Auto-Extend if Client is Active
app.post("/api/payments/generate-monthly", (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7) // Returns YYYY-MM
  const today = new Date().toISOString().split("T")[0]
  
  // 1. Find ALL monthly permits where the CLIENT IS ACTIVE
  const query = `
    SELECT p.*, c.client_id 
    FROM permits p 
    JOIN cars c ON p.car_id = c.id 
    JOIN clients cl ON c.client_id = cl.id
    WHERE p.permit_type = 'monthly' AND cl.active = 1
  `
  
  db.all(query, async (err, monthlyPermits) => {
    if (err) return res.status(500).json({ error: "Database error finding permits" })

    let createdCount = 0
    let skippedCount = 0
    let extendedCount = 0

    const processPermits = async () => {
      for (const permit of monthlyPermits) {
        
        // AUTO-EXTEND CHECK: Is this permit expired?
        if (permit.end_date < today) {
            // It's expired. Standard Monthly Renew.
            // Extend end_date by 1 month.
            const newEndDate = new Date(new Date(today).setDate(new Date(today).getDate() + 30)).toISOString().split('T')[0];
            const addedCost = permit.daily_rate; // This is the monthly rate
            const newTotalCost = permit.total_cost + addedCost;

            await new Promise((resolve) => {
                db.run(
                    "UPDATE permits SET end_date = ?, total_cost = ? WHERE id = ?",
                    [newEndDate, newTotalCost, permit.id],
                    (err) => {
                        if (!err) {
                            permit.end_date = newEndDate;
                            permit.total_cost = newTotalCost;
                            extendedCount++;
                        }
                        resolve();
                    }
                );
            });
        }

        // INVOICE CHECK
        await new Promise((resolve) => {
          db.get(
            `SELECT SUM(amount) as total_paid FROM payments WHERE permit_id = ?`,
            [permit.id],
            (err, result) => {
              const totalPaidSoFar = result && result.total_paid ? result.total_paid : 0;
              
              if (totalPaidSoFar >= permit.total_cost) {
                skippedCount++;
                resolve();
                return;
              }

              db.get(
                `SELECT id FROM payments 
                 WHERE permit_id = ? 
                 AND strftime('%Y-%m', created_at) = ?`,
                [permit.id, currentMonth],
                (err, existingPayment) => {
                  if (existingPayment) {
                    skippedCount++
                    resolve()
                  } else {
                    const remainingBalance = permit.total_cost - totalPaidSoFar;
                    const amountToBill = Math.min(permit.daily_rate, remainingBalance);
                    
                    if (amountToBill > 0) {
                        db.run(
                          "INSERT INTO payments (permit_id, client_id, amount, is_paid) VALUES (?, ?, ?, 0)",
                          [permit.id, permit.client_id, amountToBill],
                          (err) => {
                            if (!err) createdCount++
                            resolve()
                          }
                        )
                    } else {
                        resolve();
                    }
                  }
                }
              )
            }
          )
        })
      }
    }

    await processPermits()
    res.json({ 
      success: true, 
      message: `Generated ${createdCount} invoices. Extended ${extendedCount} expired permits.`,
      createdCount,
      skippedCount,
      extendedCount
    })
  })
})

app.get("/api/reports", (req, res) => {
  const { startDate, endDate } = req.query
  let query = `
    SELECT 
      cl.id,
      cl.first_name,
      cl.last_name,
      cl.email,
      cl.client_type,
      COUNT(DISTINCT c.id) as car_count,
      COUNT(DISTINCT CASE WHEN per.id IS NOT NULL THEN per.id END) as permit_count,
      COALESCE(SUM(CASE WHEN pay.is_paid = 1 THEN pay.amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN pay.is_paid = 0 THEN pay.amount ELSE 0 END), 0) as total_pending
    FROM clients cl
    LEFT JOIN cars c ON cl.id = c.client_id
    LEFT JOIN permits per ON c.id = per.car_id
    LEFT JOIN payments pay ON per.id = pay.permit_id`

  const params = []
  if (startDate && endDate) {
    query += ` WHERE per.start_date >= ? AND per.start_date <= ?`
    params.push(startDate, endDate)
  }
  query += ` GROUP BY cl.id ORDER BY cl.first_name`

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" })
    res.json(rows || [])
  })
})

initializeDatabase()

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API is ready to accept requests`)
})

