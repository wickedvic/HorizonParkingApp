"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import ClientsPage from "./ClientsPage"
import PermitsPage from "./PermitsPage"
import PaymentsPage from "./PaymentsPage"
import ReportsPage from "./ReportsPage"
import CarsPage from "./CarsPage"
import "./Dashboard.css"

export default function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [stats, setStats] = useState({ clients: 0, permits: 0, paid: 0, pending: 0 })
  const [initialClientFilter, setInitialClientFilter] = useState("")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [clients, permits, payments] = await Promise.all([
        fetch(`${API_BASE_URL}/clients`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/permits`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/payments`).then((r) => r.json()),
      ])

      const paid = payments.filter((p) => p.is_paid).reduce((sum, p) => sum + p.amount, 0)
      const pending = payments.filter((p) => !p.is_paid).reduce((sum, p) => sum + p.amount, 0)

      setStats({
        clients: clients.length,
        permits: permits.length,
        paid,
        pending,
      })
    } catch (err) {
      console.error("Failed to load stats:", err)
    }
  }

  const handleNavigateToClients = (clientName) => {
    setInitialClientFilter(clientName)
    setCurrentPage("clients")
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h1>🚗 Horizon Parking</h1>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-btn ${currentPage === "dashboard" ? "active" : ""}`} onClick={() => setCurrentPage("dashboard")}>
            📊 Dashboard
          </button>
          <button className={`nav-btn ${currentPage === "clients" ? "active" : ""}`} onClick={() => setCurrentPage("clients")}>
            👥 Clients
          </button>
          <button className={`nav-btn ${currentPage === "cars" ? "active" : ""}`} onClick={() => setCurrentPage("cars")}>
            🚙 Vehicles
          </button>
          <button className={`nav-btn ${currentPage === "permits" ? "active" : ""}`} onClick={() => setCurrentPage("permits")}>
            🎫 Permits
          </button>
          <button className={`nav-btn ${currentPage === "payments" ? "active" : ""}`} onClick={() => setCurrentPage("payments")}>
            💰 Billing
          </button>
          <button className={`nav-btn ${currentPage === "reports" ? "active" : ""}`} onClick={() => setCurrentPage("reports")}>
            📈 Reports
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            Logged in as <strong>{user.username}</strong>
          </div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        {currentPage === "dashboard" && (
          <div className="animate-fade-in">
            <h2 className="page-title">Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card info">
                <h3>Total Clients</h3>
                <p className="stat-number">{stats.clients}</p>
              </div>
              <div className="stat-card warning">
                <h3>Active Permits</h3>
                <p className="stat-number">{stats.permits}</p>
              </div>
              <div className="stat-card success">
                <h3>Revenue (Paid)</h3>
                <p className="stat-number" style={{color: '#27ae60'}}>${stats.paid.toFixed(2)}</p>
              </div>
              <div className="stat-card primary">
                <h3>Pending Invoices</h3>
                <p className="stat-number" style={{color: '#e67e22'}}>${stats.pending.toFixed(2)}</p>
              </div>
            </div>

            <h3 style={{marginBottom: '20px', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Quick Actions</h3>
            <div className="dashboard-actions">
                <button className="action-btn" onClick={() => setCurrentPage("permits")}>
                    <span style={{fontSize: '24px', marginRight: '10px'}}>🎫</span> Issue New Permit
                </button>
                <button className="action-btn" onClick={() => setCurrentPage("clients")}>
                    <span style={{fontSize: '24px', marginRight: '10px'}}>👥</span> Register Client
                </button>
                <button className="action-btn" onClick={() => setCurrentPage("payments")}>
                    <span style={{fontSize: '24px', marginRight: '10px'}}>💰</span> View Pending
                </button>
            </div>
          </div>
        )}
        
        {currentPage === "clients" && (
          <ClientsPage user={user} onUpdate={loadStats} initialFilter={initialClientFilter} />
        )}
        {currentPage === "cars" && (
          <CarsPage user={user} onNavigateClient={handleNavigateToClients} />
        )}
        {currentPage === "permits" && <PermitsPage user={user} />}
        {currentPage === "payments" && <PaymentsPage user={user} onUpdate={loadStats} />}
        {currentPage === "reports" && <ReportsPage user={user} />}
      </main>
    </div>
  )
}