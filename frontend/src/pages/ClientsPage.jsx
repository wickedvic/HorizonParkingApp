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
      const data = await res.json()
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

  const handleAddCar = async (e) => {
    e.preventDefault()
    if (!selectedClient) return
    try {
      const res = await fetch(`${API_BASE_URL}/cars`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
            owner_id: selectedClient.id, 
            ...carForm,
            state: "NY" 
        }) 
      })
      if (res.ok) { 
        loadCars(selectedClient.id); 
        setCarForm({ license_plate: "", make: "", model: "", color: "", year: new Date().getFullYear() }); 
        setShowCarForm(false); 
      }
    } catch (err) { console.error("Failed to add car:", err) }
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

  const filteredClients = clients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(filterName.toLowerCase())
  })

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Clients Management</h2>
        {(user.role === "admin" || user.role === "front_desk") && <button className="btn-primary" onClick={handleAddClick}>{showForm && !editingId ? "Cancel" : "Add New Client"}</button>}
      </div>
      <div className="filter-section">
        <input type="text" placeholder="Search by name..." value={filterName} onChange={(e) => setFilterName(e.target.value)} className="filter-input" />
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
          </form>
        </div>
      )}
      <div className="clients-list">
        {filteredClients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-info">
                <h3>{client.first_name} {client.last_name}</h3>
                <p className="contact">{client.email}</p>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button className="btn-secondary" onClick={() => handleEditClick(client)}>Edit</button>
                <button className="btn-secondary" onClick={() => { setSelectedClient(client); loadCars(client.id) }}>View Vehicles</button>
              </div>
            </div>
          ))}
      </div>
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Vehicles</h2><button className="btn-close" onClick={() => setSelectedClient(null)}>×</button></div>
            <form onSubmit={handleAddCar} className="car-form">
                <input type="text" placeholder="Plate" value={carForm.license_plate} onChange={(e) => setCarForm({ ...carForm, license_plate: e.target.value })} required />
                <input type="text" placeholder="Make" value={carForm.make} onChange={(e) => setCarForm({ ...carForm, make: e.target.value })} required />
                <input type="text" placeholder="Model" value={carForm.model} onChange={(e) => setCarForm({ ...carForm, model: e.target.value })} required />
                <button type="submit" className="btn-primary">Add Car</button>
            </form>
            <div className="cars-list">
              {cars.map((car) => (
                  <div key={car.id} className="car-item"><h4>{car.make} {car.model}</h4><p>{car.license_plate}</p></div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}