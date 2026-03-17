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
  const [stats, setStats] = useState({ clients: 0, cars: 0, permits: 0, payments: 0 })
  
  // Navigation States
  const [initialClientFilter, setInitialClientFilter] = useState("")
  const [initialCarFilter, setInitialCarFilter] = useState("")
  const [permitFilter, setPermitFilter] = useState("")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [clientsRes, carsRes, permitsRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/cars`),
        fetch(`${API_BASE_URL}/permits`),
        fetch(`${API_BASE_URL}/payments`),
      ])
      const clients = await clientsRes.json()
      const cars = await carsRes.json()
      const permits = await permitsRes.json()
      const payments = await paymentsRes.json()

      setStats({
        clients: Array.isArray(clients) ? clients.length : 0,
        cars: Array.isArray(cars) ? cars.length : 0,
        permits: Array.isArray(permits) ? permits.length : 0,
        payments: Array.isArray(payments) ? payments.length : 0,
      })
    } catch (err) { console.error("Stats load failed:", err) }
  }

  const handleNavigateToClients = (ownerId) => {
    setInitialClientFilter(ownerId)
    setInitialCarFilter("")
    setPermitFilter("")
    setCurrentPage("clients")
  }

  const handleNavigateToCars = (plate) => {
    setInitialCarFilter(plate)
    setInitialClientFilter("")
    setPermitFilter("")
    setCurrentPage("cars")
  }

  const handleNavigateToPermits = (num) => {
    setPermitFilter(num)
    setInitialCarFilter("")
    setInitialClientFilter("")
    setCurrentPage("permits")
  }

  const navTo = (page) => {
    setInitialClientFilter("")
    setInitialCarFilter("")
    setPermitFilter("")
    setCurrentPage(page)
  }

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand"><h1>🚗 Horizon Parking</h1></div>
        <nav className="sidebar-nav">
          <button className={`nav-btn ${currentPage === "dashboard" ? "active" : ""}`} onClick={() => navTo("dashboard")}>📊 Dashboard</button>
          <button className={`nav-btn ${currentPage === "clients" ? "active" : ""}`} onClick={() => navTo("clients")}>👥 Clients</button>
          <button className={`nav-btn ${currentPage === "cars" ? "active" : ""}`} onClick={() => navTo("cars")}>🚙 Vehicles</button>
          <button className={`nav-btn ${currentPage === "permits" ? "active" : ""}`} onClick={() => navTo("permits")}>🎫 Temporary Permits</button>
          <button className={`nav-btn ${currentPage === "payments" ? "active" : ""}`} onClick={() => navTo("payments")}>💰 Billing</button>
          <button className={`nav-btn ${currentPage === "reports" ? "active" : ""}`} onClick={() => navTo("reports")}>📈 Reports</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">Logged in as <strong>{user.username}</strong></div>
          <button onClick={onLogout} className="btn-logout">Sign Out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        {currentPage === "dashboard" && (
          <div className="animate-fade-in">
            <h2 className="page-title">Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card info"><h3>Total Clients</h3><p className="stat-number">{stats.clients}</p></div>
              <div className="stat-card warning"><h3>Total Vehicles</h3><p className="stat-number">{stats.cars}</p></div>
              <div className="stat-card success"><h3>Permit Records</h3><p className="stat-number">{stats.permits}</p></div>
              <div className="stat-card primary"><h3>Payment Records</h3><p className="stat-number">{stats.payments}</p></div>
            </div>
          </div>
        )}
        
        {currentPage === "clients" && (
          <ClientsPage 
            user={user} 
            initialFilter={initialClientFilter} 
            onNavigateCar={handleNavigateToCars} 
            onNavigatePermit={handleNavigateToPermits} 
          />
        )}
        {currentPage === "cars" && (
          <CarsPage 
            user={user} 
            initialFilter={initialCarFilter} 
            onNavigateClient={handleNavigateToClients} 
          />
        )}
        {currentPage === "permits" && <PermitsPage user={user} initialFilter={permitFilter} />}
        {currentPage === "payments" && <PaymentsPage user={user} onUpdate={loadStats} />}
        {currentPage === "reports" && <ReportsPage user={user} />}
      </main>
    </div>
  )
}