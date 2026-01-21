"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./ClientsPage.css"

export default function ClientsPage({ user, onUpdate, initialFilter }) {
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [cars, setCars] = useState([])
  
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", client_type: "temp",
  })
  
  const [carForm, setCarForm] = useState({
    license_plate: "", make: "", model: "", color: "", year: new Date().getFullYear(),
  })
  const [showCarForm, setShowCarForm] = useState(false)
  const [filterName, setFilterName] = useState(initialFilter || "")

  useEffect(() => { loadClients(); if (initialFilter) setFilterName(initialFilter) }, [initialFilter])

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`)
      console.log("RES:", res);
      const data = await res.json()
      console.log("DATA:", data)
      setClients(data)
    } catch (err) { console.error("Failed to load clients:", err) }
  }

  const loadCars = async (clientId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars?client_id=${clientId}`)
      const data = await res.json()
      setCars(data)
    } catch (err) { console.error("Failed to load cars:", err) }
  }

  const handleToggleActive = async (client) => {
      const newStatus = client.active === 1 ? false : true;
      const action = newStatus ? "activate" : "deactivate";
      if (confirm(`Are you sure you want to ${action} ${client.first_name}?`)) {
          try {
              const res = await fetch(`${API_BASE_URL}/clients/${client.id}/toggle-active`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ active: newStatus })
              });
              if (res.ok) loadClients();
          } catch(err) { console.error(err); }
      }
  }

  const handleDeleteClient = async (id, name) => {
      if (window.confirm(`Delete ${name}? This will remove all their vehicles and history.`)) {
          try {
              const res = await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
              if (res.ok) { loadClients(); onUpdate(); }
          } catch (err) { console.error("Error deleting client:", err); }
      }
  }

  const handleSubmitClient = async (e) => {
    e.preventDefault()
    const url = editingId ? `${API_BASE_URL}/clients/${editingId}` : `${API_BASE_URL}/clients`
    const method = editingId ? "PUT" : "POST"
    try {
      const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) })
      if (res.ok) { loadClients(); onUpdate(); resetForm(); setShowForm(false); }
    } catch (err) { console.error("Failed to save client:", err) }
  }

  const resetForm = () => { setFormData({ first_name: "", last_name: "", email: "", phone: "", client_type: "temp" }); setEditingId(null); }
  const handleEditClick = (client) => { setFormData({ first_name: client.first_name, last_name: client.last_name, email: client.email, phone: client.phone, client_type: client.client_type || "temp" }); setEditingId(client.id); setShowForm(true); }
  const handleAddClick = () => { resetForm(); setShowForm(!showForm); }
  const handleAddCar = async (e) => {
    e.preventDefault()
    if (!selectedClient) return
    try {
      const res = await fetch(`${API_BASE_URL}/cars`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: selectedClient.id, ...carForm }) })
      if (res.ok) { loadCars(selectedClient.id); setCarForm({ license_plate: "", make: "", model: "", color: "", year: new Date().getFullYear() }); setShowCarForm(false); }
    } catch (err) { console.error("Failed to add car:", err) }
  }

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(filterName.toLowerCase()) || (client.email && client.email.toLowerCase().includes(filterName.toLowerCase()))
  })

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Clients Management</h2>
        {(user.role === "admin" || user.role === "front_desk") && <button className="btn-primary" onClick={handleAddClick}>{showForm && !editingId ? "Cancel" : "Add New Client"}</button>}
      </div>
      <div className="filter-section">
        <input type="text" placeholder="Search by name or email..." value={filterName} onChange={(e) => setFilterName(e.target.value)} className="filter-input" />
      </div>
      {showForm && (
        <div className="form-card">
          <h3>{editingId ? "Edit Client" : "Register New Client"}</h3>
          <form onSubmit={handleSubmitClient} className="client-form">
            <input type="text" placeholder="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
            <input type="text" placeholder="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <select value={formData.client_type} onChange={(e) => setFormData({ ...formData, client_type: e.target.value })}>
                <option value="temp">Temp</option>
                <option value="employee">Employee</option>
            </select>
            <button type="submit" className="btn-primary">{editingId ? "Save Changes" : "Register Client"} </button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>}
          </form>
        </div>
      )}
      <div className="clients-list">
        {filteredClients.length === 0 ? <p className="empty-message">No clients found</p> : filteredClients.map((client) => (
            <div key={client.id} className={`client-card ${client.active === 0 ? 'inactive-client' : ''}`} style={client.active === 0 ? {opacity: 0.6} : {}}>
              <div className="client-info">
                <h3>{client.first_name} {client.last_name} 
                    <span style={{ fontSize: '12px', backgroundColor: client.client_type === 'employee' ? '#e6f7ff' : '#fff7e6', color: client.client_type === 'employee' ? '#0050b3' : '#d46b08', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px', textTransform: 'capitalize' }}>{client.client_type}</span>
                    {client.active === 0 && <span style={{fontSize: '11px', backgroundColor: '#e2e3e5', color: '#666', padding: '2px 6px', marginLeft: '8px', borderRadius:'4px'}}>Inactive</span>}
                </h3>
                <p className="contact">{client.email} | {client.phone || "No phone"}</p>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                 {(user.role === "admin" || user.role === "front_desk") && (
                  <>
                    <button className="btn-secondary" onClick={() => handleToggleActive(client)}>
                        {client.active === 1 ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn-secondary" onClick={() => handleEditClick(client)}>Edit</button>
                    {user.role === "admin" && <button className="btn-secondary" style={{color: '#dc3545'}} onClick={() => handleDeleteClient(client.id, `${client.first_name} ${client.last_name}`)}>Delete</button>}
                  </>
                 )}
                <button className="btn-secondary" onClick={() => { setSelectedClient(client); loadCars(client.id) }}>View Vehicles</button>
              </div>
            </div>
          ))}
      </div>
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>{selectedClient.first_name} {selectedClient.last_name} - Vehicles</h2><button className="btn-close" onClick={() => setSelectedClient(null)}>×</button></div>
            {(user.role === "admin" || user.role === "front_desk") && (
              <>
                {showCarForm && (
                  <form onSubmit={handleAddCar} className="car-form">
                    <input type="text" placeholder="License Plate" value={carForm.license_plate} onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })} required />
                    <input type="text" placeholder="Make" value={carForm.make} onChange={(e) => setCarForm({ ...carForm, make: e.target.value })} required />
                    <input type="text" placeholder="Model" value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} required />
                    <input type="text" placeholder="Color" value={carForm.color} onChange={(e) => setCarForm({ ...carForm, color: e.target.value })} />
                    <input type="number" placeholder="Year" value={carForm.year} onChange={(e) => setCarForm({ ...carForm, year: Number.parseInt(e.target.value) })} />
                    <button type="submit" className="btn-primary">Add Car</button>
                    <button type="button" className="btn-secondary" onClick={() => setShowCarForm(false)}>Cancel</button>
                  </form>
                )}
                {!showCarForm && <button className="btn-primary" onClick={() => setShowCarForm(true)}>Add New Vehicle</button>}
              </>
            )}
            <div className="cars-list">
              {cars.length === 0 ? <p className="empty-message">No vehicles registered</p> : cars.map((car) => (
                  <div key={car.id} className="car-item"><h4>{car.make} {car.model} ({car.year})</h4><p>License Plate: <strong>{car.license_plate}</strong></p></div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}