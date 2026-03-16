"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./ClientsPage.css"

export default function ClientsPage({ user, onUpdate, initialFilter }) {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientCars, setClientCars] = useState([])
  const [filterName, setFilterName] = useState(initialFilter || "")

  useEffect(() => { 
    loadClients()
    if (initialFilter) setFilterName(initialFilter) 
  }, [initialFilter])

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`)
      const data = await res.json()
      setClients(data)
    } catch (err) { console.error("Failed to load clients:", err) }
  }

  const loadCarsForClient = async (clientId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`)
      const allCars = await res.json()
      // Matches your car owner_id to the PeopleID
      const filtered = allCars.filter(car => car.owner_id == clientId)
      setClientCars(filtered)
    } catch (err) { console.error("Failed to load cars:", err) }
  }

  const filteredClients = Array.isArray(clients) ? clients.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
    return fullName.includes(filterName.toLowerCase())
  }) : []

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Client Directory (People)</h2>
      </div>

      <div className="filter-section">
        <input 
          type="text" 
          placeholder="Search by name..." 
          value={filterName} 
          onChange={(e) => setFilterName(e.target.value)} 
          className="filter-input" 
        />
      </div>

      <div className="clients-list">
        {filteredClients.length === 0 ? (
          <p className="empty-message">No clients found</p>
        ) : (
          filteredClients.map((person) => (
            <div key={person.id} className="client-card">
              <div className="client-info">
                <h3>{person.firstName} {person.lastName}</h3>
                <p className="contact">
                    <strong>ID:</strong> {person.id} | 
                    <strong> Type:</strong> {person.type || 'N/A'}
                </p>
                <p className="contact" style={{fontSize: '0.9em', color: '#666'}}>
                    {person.email} | {person.phone}
                </p>
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button 
                  className="btn-secondary" 
                  onClick={() => { 
                    setSelectedClient(person); 
                    loadCarsForClient(person.id) 
                  }}
                >
                  View Vehicles
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Vehicles for {selectedClient.firstName}</h2>
              <button className="btn-close" onClick={() => setSelectedClient(null)}>×</button>
            </div>
            <div className="cars-list">
              {clientCars.length === 0 ? (
                <p className="empty-message">No vehicles registered for this client</p>
              ) : (
                clientCars.map((car) => (
                  <div key={car.id} className="car-item">
                    <h4>{car.make} {car.model}</h4>
                    <p>License: <strong>{car.license_plate?.split('\r')[0]}</strong></p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}