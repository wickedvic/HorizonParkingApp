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
  Badge as PermitIcon,
  People as PeopleIcon,
  AssignmentTurnedIn as VerifiedIcon
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
  Chip,
  Stack
} from "@mui/material"
import "./Dashboard.css"

export default function Dashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [stats, setStats] = useState({ activeClients: 0, activePermits: 0 })
  const [globalSearch, setGlobalSearch] = useState("") 
  
  const [rawData, setRawData] = useState({ clients: [], cars: [] })

  const [initialClientFilter, setInitialClientFilter] = useState("")
  const [initialCarFilter, setInitialCarFilter] = useState("")
  const [permitFilter, setPermitFilter] = useState("")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [clientsRes, carsRes, permitsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clients`),
        fetch(`${API_BASE_URL}/cars`),
        fetch(`${API_BASE_URL}/permits`),
      ])
      const clients = await clientsRes.json()
      const cars = await carsRes.json()
      const permits = await permitsRes.json()

      const activeClientsCount = Array.isArray(clients) 
        ? clients.filter(c => c.status?.toLowerCase() === 'active').length 
        : 0;
      
      const today = new Date().toISOString().split('T')[0];
      const activePermitsCount = Array.isArray(permits)
        ? permits.filter(p => p.PermitEndDate >= today).length
        : 0;

      setRawData({ clients: Array.isArray(clients) ? clients : [], cars: Array.isArray(cars) ? cars : [] })
      setStats({
        activeClients: activeClientsCount,
        activePermits: activePermitsCount,
      })
    } catch (err) { console.error("Stats load failed:", err) }
  }

  const quickSearchResults = useMemo(() => {
    if (globalSearch.length < 2) return { clients: [], cars: [] };
    const query = globalSearch.toLowerCase();

    const filteredClients = rawData.clients.filter(c => 
      c.firstName?.toLowerCase().includes(query) || 
      c.lastName?.toLowerCase().includes(query) || 
      c.permitNumber?.toLowerCase().includes(query)
    ).slice(0, 5);

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

  const handleNavigateToClients = (ownerIdOrQuery) => {
    // FIX: If it's a numeric ID (from dropdown), pass it as an object for exact filtering
    if (typeof ownerIdOrQuery === 'number') {
      setInitialClientFilter({ id: ownerIdOrQuery });
    } else {
      setInitialClientFilter(ownerIdOrQuery.toString());
    }
    setInitialCarFilter("");
    setPermitFilter("");
    setCurrentPage("clients");
  }

  const handleNavigateToCars = (plate) => {
    setInitialCarFilter(plate); setInitialClientFilter(""); setPermitFilter(""); setCurrentPage("cars");
  }

  const handleNavigateToPermits = (num) => {
    setPermitFilter(num); setInitialCarFilter(""); setInitialClientFilter(""); setCurrentPage("permits");
  }

  const navTo = (page) => {
    setInitialClientFilter(""); setInitialCarFilter(""); setPermitFilter(""); setCurrentPage(page);
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
            <Paper elevation={0} sx={{ p: '24px', mb: '30px', borderRadius: '16px', border: '1px solid #eef2f6', background: '#fff', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#1a2027' }}>Quick System Check</Typography>
                <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(25, 118, 210, 0.08)' }}><PeopleIcon color="primary" /></Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1976d2', lineHeight: 1 }}>{stats.activeClients}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Total Active Clients</Typography>
                        </Box>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(46, 125, 50, 0.08)' }}><VerifiedIcon color="success" /></Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2e7d32', lineHeight: 1 }}>{stats.activePermits}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>Active Temp Permits</Typography>
                        </Box>
                    </Box>
                </Stack>

                <form onSubmit={handleGlobalSearchSubmit}>
                    <div style={{ position: 'relative' }}>
                        <SearchIcon sx={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text"
                            placeholder="Check name, license plate, or permit #..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '2px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: 500, outline: 'none' }}
                        />
                    </div>
                </form>

                {globalSearch.length >= 2 && (
                    <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: '24px', right: '24px', zIndex: 10, mt: 1, maxHeight: '400px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eef2f6' }}>
                        <List>
                            {quickSearchResults.clients.length > 0 && (
                                <>
                                    <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', fontWeight: 800, color: 'primary.main' }}>Matching Clients</Typography>
                                    {quickSearchResults.clients.map(c => (
                                        <ListItem key={c.id} button onClick={() => handleNavigateToClients(c.id)}>
                                            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                                            <ListItemText primary={`${c.firstName} ${c.lastName}`} secondary={`Permit: ${c.permitNumber || 'None'} | ID: ${c.id}`} />
                                            <Chip label="Client" size="small" variant="outlined" />
                                        </ListItem>
                                    ))}
                                    <Divider />
                                </>
                            )}
                            {quickSearchResults.cars.length > 0 && (
                                <>
                                    <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', fontWeight: 800, color: 'warning.main' }}>Matching Vehicles</Typography>
                                    {quickSearchResults.cars.map(car => (
                                        <ListItem key={car.id} button onClick={() => handleNavigateToCars(car.license_plate)}>
                                            <ListItemIcon><CarIcon color="warning" /></ListItemIcon>
                                            <ListItemText primary={car.license_plate?.split('\r')[0]} secondary={`${car.make} ${car.model || ''}`} />
                                            <Chip label="Vehicle" size="small" variant="outlined" />
                                        </ListItem>
                                    ))}
                                </>
                            )}
                        </List>
                    </Paper>
                )}
            </Paper>
          </div>
        )}
        
        {currentPage === "clients" && <ClientsPage user={user} initialFilter={initialClientFilter} onNavigateCar={handleNavigateToCars} onNavigatePermit={handleNavigateToPermits} />}
        {currentPage === "cars" && <CarsPage user={user} initialFilter={initialCarFilter} onNavigateClient={handleNavigateToClients} />}
        {currentPage === "permits" && <PermitsPage user={user} initialFilter={permitFilter} />}
        {currentPage === "payments" && <PaymentsPage user={user} onUpdate={loadStats} />}
        {currentPage === "reports" && <ReportsPage user={user} />}
      </main>
    </div>
  )
}