"use client"

import { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import ClientsPage from "./ClientsPage"
import PermitsPage from "./PermitsPage"
import PaymentsPage from "./PaymentsPage"
import ReportsPage from "./ReportsPage"
import CarsPage from "./CarsPage"
import { 
  Search as SearchIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Badge as PermitIcon
} from "@mui/icons-material"
import { 
  Paper, 
  Typography, 
  Box, 
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from "@mui/material"
import "./Dashboard.css"

export default function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [stats, setStats] = useState({ clients: 0, cars: 0, permits: 0, payments: 0 })
  const [globalSearch, setGlobalSearch] = useState("") 
  
  // Data for live quick-search
  const [rawData, setRawData] = useState({ clients: [], cars: [] })

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

      setRawData({ clients: Array.isArray(clients) ? clients : [], cars: Array.isArray(cars) ? cars : [] })
      setStats({
        clients: Array.isArray(clients) ? clients.length : 0,
        cars: Array.isArray(cars) ? cars.length : 0,
        permits: Array.isArray(permits) ? permits.length : 0,
        payments: Array.isArray(payments) ? payments.length : 0,
      })
    } catch (err) { console.error("Stats load failed:", err) }
  }

  // --- QUICK SEARCH LOGIC ---
  const quickSearchResults = useMemo(() => {
    if (globalSearch.length < 2) return { clients: [], cars: [] };
    const query = globalSearch.toLowerCase();

    const filteredClients = rawData.clients.filter(c => 
      c.firstName?.toLowerCase().includes(query) || 
      c.lastName?.toLowerCase().includes(query) || 
      c.permitNumber?.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to top 5

    const filteredCars = rawData.cars.filter(car => 
      car.license_plate?.toLowerCase().includes(query) ||
      car.make?.toLowerCase().includes(query)
    ).slice(0, 5);

    return { clients: filteredClients, cars: filteredCars };
  }, [globalSearch, rawData]);

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const query = globalSearch.trim();
    
    // FIX: Check if it starts with P- for Permits first
    const isPermit = query.toUpperCase().startsWith('P-');
    const looksLikePlate = /[A-Z0-9]{3,}/.test(query) && query.length <= 8;

    if (isPermit) {
        handleNavigateToClients(query);
    } else if (looksLikePlate) {
        handleNavigateToCars(query);
    } else {
        handleNavigateToClients(query);
    }
    setGlobalSearch(""); 
  };

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
            
            <Paper elevation={0} sx={{ p: '20px', mb: '30px', borderRadius: '12px', border: '1px solid #e0e0e0', background: '#fff', position: 'relative' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Quick System Check</Typography>
                <form onSubmit={handleGlobalSearchSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flexGrow: 1 }}>
                        <SearchIcon sx={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#95a5a6' }} />
                        <input 
                            type="text"
                            placeholder="Type a name, plate, or permit..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '16px', outline: 'none' }}
                        />
                    </div>
                </form>

                {/* --- LIVE RESULTS DROPDOWN --- */}
                {globalSearch.length >= 2 && (
                    <Paper elevation={4} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, mt: 1, maxHeight: '400px', overflowY: 'auto', borderRadius: '8px' }}>
                        <List subheader={<li />}>
                            {quickSearchResults.clients.length > 0 && (
                                <>
                                    <Typography variant="overline" sx={{ px: 2, fontWeight: 'bold', color: 'primary.main' }}>Matching Clients</Typography>
                                    {quickSearchResults.clients.map(c => (
                                        <ListItem key={c.id} button onClick={() => handleNavigateToClients(c.lastName)}>
                                            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary={`${c.firstName} ${c.lastName}`} secondary={`Permit: ${c.permitNumber || 'None'}`} />
                                            <Chip label="Client" size="small" variant="outlined" />
                                        </ListItem>
                                    ))}
                                    <Divider />
                                </>
                            )}
                            {quickSearchResults.cars.length > 0 && (
                                <>
                                    <Typography variant="overline" sx={{ px: 2, fontWeight: 'bold', color: 'warning.main' }}>Matching Vehicles</Typography>
                                    {quickSearchResults.cars.map(car => (
                                        <ListItem key={car.id} button onClick={() => handleNavigateToCars(car.license_plate)}>
                                            <ListItemIcon><CarIcon color="warning" /></ListItemIcon>
                                            <ListItemText primary={car.license_plate?.split('\r')[0]} secondary={`${car.make} ${car.model || ''}`} />
                                            <Chip label="Vehicle" size="small" variant="outlined" />
                                        </ListItem>
                                    ))}
                                </>
                            )}
                            {quickSearchResults.clients.length === 0 && quickSearchResults.cars.length === 0 && (
                                <ListItem><ListItemText primary="No matches found in the system." /></ListItem>
                            )}
                        </List>
                    </Paper>
                )}
            </Paper>

            <div className="stats-grid">
              <div className="stat-card info"><h3>Total Clients</h3><p className="stat-number">{stats.clients}</p></div>
              <div className="stat-card warning"><h3>Total Vehicles</h3><p className="stat-number">{stats.cars}</p></div>
              <div className="stat-card success"><h3>Permit Records</h3><p className="stat-number">{stats.permits}</p></div>
              <div className="stat-card primary"><h3>Payment Records</h3><p className="stat-number">{stats.payments}</p></div>
            </div>
          </div>
        )}
        
        {/* ... (rest of the pages remain same) */}
        {currentPage === "clients" && <ClientsPage user={user} initialFilter={initialClientFilter} onNavigateCar={handleNavigateToCars} onNavigatePermit={handleNavigateToPermits} />}
        {currentPage === "cars" && <CarsPage user={user} initialFilter={initialCarFilter} onNavigateClient={handleNavigateToClients} />}
        {currentPage === "permits" && <PermitsPage user={user} initialFilter={permitFilter} />}
        {currentPage === "payments" && <PaymentsPage user={user} onUpdate={loadStats} />}
        {currentPage === "reports" && <ReportsPage user={user} />}
      </main>
    </div>
  )
}