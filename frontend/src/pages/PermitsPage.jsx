"use client"

import { useState, useEffect } from "react"
const API_BASE_URL = "http://localhost:5001"
import "./PermitsPage.css"

export default function PermitsPage({ user }) {
  const [permits, setPermits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [cars, setCars] = useState([])
  const [formData, setFormData] = useState({
    car_id: "",
    permit_type: "custom",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    daily_rate: "",
  })
  
  // QUICK PERMIT STATE
  const [showQuickPermit, setShowQuickPermit] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", plate: "", make: "" });

  // FILTERS
  const [filterSearch, setFilterSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  // Replaced "Month Picker" with full Date Range support + Active toggle
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filterStatus, setFilterStatus] = useState("active"); // 'all', 'active', 'inactive'

  useEffect(() => {
    loadPermits()
    loadCars()
  }, [])

  const loadPermits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/permits`)
      const data = await res.json()
      setPermits(data)
    } catch (err) { console.error("Failed to load permits:", err) }
  }

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cars`)
      const data = await res.json()
      data.sort((a, b) => a.first_name.localeCompare(b.first_name))
      setCars(data)
    } catch (err) { console.error("Failed to load cars:", err) }
  }

  const handleDeletePermit = async (id) => {
    if (window.confirm("Are you sure you want to delete this permit?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/permits/${id}`, { method: 'DELETE' })
        if (res.ok) loadPermits()
      } catch (err) { console.error("Error deleting permit:", err) }
    }
  }

  const calculateCost = () => {
    if (!formData.daily_rate) return 0
    const rate = Number.parseFloat(formData.daily_rate)
    
    if (formData.permit_type === "monthly") return rate;

    // Custom
    const start = new Date(formData.start_date)
    const end = new Date(formData.end_date)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays * rate
  }

  const handleAddPermit = async (e) => {
    e.preventDefault()
    let finalEndDate = formData.end_date;
    let totalCost = 0;

    if (formData.permit_type === "monthly") {
        const startDateObj = new Date(formData.start_date);
        const endDateObj = new Date(startDateObj);
        endDateObj.setMonth(endDateObj.getMonth() + 1);
        finalEndDate = endDateObj.toISOString().split('T')[0];
        totalCost = Number.parseFloat(formData.daily_rate);
    } else {
        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1
        if (end < start) { alert("Error: End date cannot be before start date."); return }
        totalCost = diffDays * Number.parseFloat(formData.daily_rate);
    }

    const permitNumber = `PMT-${Date.now()}`

    try {
      const res = await fetch(`${API_BASE_URL}/api/permits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permit_number: permitNumber,
          car_id: Number.parseInt(formData.car_id),
          permit_type: formData.permit_type,
          start_date: formData.start_date,
          end_date: finalEndDate,
          daily_rate: Number.parseFloat(formData.daily_rate),
          total_cost: totalCost,
        }),
      })
      if (res.ok) {
        loadPermits()
        setFormData({ car_id: "", permit_type: "custom", start_date: new Date().toISOString().split("T")[0], end_date: new Date().toISOString().split("T")[0], daily_rate: "" })
        setShowForm(false)
      }
    } catch (err) { console.error("Failed to add permit:", err) }
  }

  // --- QUICK PERMIT GENERATOR ---
  const handleQuickPermitPrint = () => {
      const id = `QP-${Date.now().toString().slice(-6)}`;
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      const win = window.open('', '', 'width=600,height=400');
      win.document.write(`
        <html>
          <head>
            <title>Quick Permit</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; border: 5px solid #333; margin: 20px; }
              h1 { font-size: 28px; margin-bottom: 10px; }
              h2 { color: #555; }
              .plate { font-size: 40px; font-weight: bold; margin: 20px 0; border: 2px dashed #333; display: inline-block; padding: 10px 30px; }
              .meta { margin-top: 20px; font-size: 14px; color: #777; }
            </style>
          </head>
          <body>
            <h1>Horizon Staffing Solutions</h1>
            <h2>Daily Visitor Permit</h2>
            <div class="plate">${quickForm.plate.toUpperCase() || 'NO PLATE'}</div>
            <p><strong>Issued To:</strong> ${quickForm.name}</p>
            <p><strong>Expires:</strong> ${expires.toLocaleString()}</p>
            <div class="meta">Permit ID: ${id}</div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
      setQuickForm({ name: "", plate: "", make: "" });
      setShowQuickPermit(false);
  }

  const filteredPermits = permits.filter((permit) => {
    const searchText = `${permit.first_name} ${permit.last_name} ${permit.license_plate} ${permit.permit_number}`.toLowerCase()
    const matchesSearch = searchText.includes(filterSearch.toLowerCase())
    const matchesType = filterType === "" || permit.permit_type === filterType
    
    // Status Logic
    const isActive = new Date(permit.end_date) >= new Date();
    const matchesStatus = filterStatus === "all" ? true : filterStatus === "active" ? isActive : !isActive;

    // Date Range Logic
    let matchesDate = true;
    if (filterStart && filterEnd) {
        matchesDate = permit.start_date >= filterStart && permit.start_date <= filterEnd;
    } else if (filterStart) {
        matchesDate = permit.start_date >= filterStart;
    }

    // Filter by client active status too (optional but good UI)
    // If client is deactivated (active=0), hide their permits in 'active' view?
    // User asked "deactivate user... inactive permits". 
    // Let's rely on date active/inactive primarily for Permit Status.
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  return (
    <div className="permits-page">
      <div className="page-header">
        <h2>Parking Permits</h2>
        <div style={{display:'flex', gap:'10px'}}>
            <button className="btn-secondary" onClick={() => setShowQuickPermit(true)}>⚡ Quick Permit (24h)</button>
            {(user.role === "admin" || user.role === "front_desk") && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "Create Permit"}
            </button>
            )}
        </div>
      </div>

      <div className="filter-section">
        <input type="text" placeholder="Search..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="filter-input" />
        
        {/* Status Filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="active">Active</option>
            <option value="inactive">Expired</option>
            <option value="all">All</option>
        </select>

        {/* Date Range */}
        <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
            <span style={{fontSize:'12px', color:'#666'}}>From:</span>
            <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="filter-date" />
            <span style={{fontSize:'12px', color:'#666'}}>To:</span>
            <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="filter-date" />
        </div>

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
          <option value="">All Types</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* QUICK PERMIT MODAL */}
      {showQuickPermit && (
          <div className="modal-overlay" onClick={() => setShowQuickPermit(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px'}}>
                  <div className="modal-header">
                      <h2>⚡ Issue Quick Permit (24h)</h2>
                      <button className="btn-close" onClick={() => setShowQuickPermit(false)}>×</button>
                  </div>
                  <div style={{padding: '20px'}}>
                      <div className="form-group" style={{marginBottom: '15px'}}>
                          <label>Visitor Name</label>
                          <input type="text" value={quickForm.name} onChange={e => setQuickForm({...quickForm, name: e.target.value})} style={{width:'100%', padding:'8px'}} />
                      </div>
                      <div className="form-group" style={{marginBottom: '15px'}}>
                          <label>License Plate</label>
                          <input type="text" value={quickForm.plate} onChange={e => setQuickForm({...quickForm, plate: e.target.value})} style={{width:'100%', padding:'8px'}} />
                      </div>
                      <button className="btn-primary" style={{width:'100%'}} onClick={handleQuickPermitPrint}>Print Permit</button>
                  </div>
              </div>
          </div>
      )}

      {showForm && (
        <div className="form-card">
          <h3>Create New Permit</h3>
          <form onSubmit={handleAddPermit} className="permit-form">
            <div>
              <label>Vehicle</label>
              <select value={formData.car_id} onChange={(e) => setFormData({ ...formData, car_id: e.target.value })} required>
                <option value="">Select a vehicle</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>{car.first_name} {car.last_name} - {car.license_plate}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Permit Type</label>
              <select value={formData.permit_type} onChange={(e) => setFormData({ ...formData, permit_type: e.target.value })}>
                <option value="custom">Custom Range</option>
                <option value="monthly">Monthly (Recurring)</option>
              </select>
            </div>

            <div>
              <label>Start Date</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
            </div>

            {/* CONDITIONAL RENDER: End Date only for Custom */}
            {formData.permit_type === 'custom' && (
                <div>
                <label>End Date</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
                </div>
            )}

            <div>
              <label>{formData.permit_type === 'monthly' ? 'Monthly Rate ($)' : 'Daily Rate ($)'}</label>
              <input type="number" step="0.01" value={formData.daily_rate} onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })} required placeholder="0.00" />
            </div>

            <div className="cost-display">
              <strong>Total Cost: ${calculateCost().toFixed(2)}</strong>
            </div>

            <button type="submit" className="btn-primary">Create Permit</button>
          </form>
        </div>
      )}

      <div className="permits-list">
        {filteredPermits.length === 0 ? (
          <p className="empty-message">No permits found</p>
        ) : (
          <table className="permits-table">
            <thead>
              <tr>
                <th>Permit #</th>
                <th>Vehicle</th>
                <th>Client</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Cost</th>
                {(user.role === "admin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPermits.map((permit) => {
                  const isExpired = new Date(permit.end_date) < new Date();
                  const isActive = !isExpired;
                  return (
                    <tr key={permit.id} style={isExpired ? {opacity: 0.6} : {}}>
                      <td><strong>{permit.permit_number}</strong></td>
                      <td>{permit.license_plate}</td>
                      <td>{permit.first_name} {permit.last_name}</td>
                      <td>{permit.permit_type}</td>
                      <td style={{fontSize:'13px'}}>{permit.start_date} <span style={{color:'#999'}}>to</span> {permit.end_date}</td>
                      <td>
                          {isActive ? 
                            <span style={{color:'green', fontWeight:'bold', fontSize:'12px'}}>Active</span> : 
                            <span style={{color:'red', fontWeight:'bold', fontSize:'12px'}}>Expired</span>
                          }
                          {/* Show Client Active Status */}
                          {permit.client_active === 0 && <span style={{display:'block', fontSize:'10px', color:'#dc3545'}}>Client Deactivated</span>}
                      </td>
                      <td>${permit.total_cost.toFixed(2)}</td>
                      {(user.role === "admin") && (
                          <td>
                              <button className="btn-small btn-danger" onClick={() => handleDeletePermit(permit.id)}>Delete</button>
                          </td>
                      )}
                    </tr>
                  );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}