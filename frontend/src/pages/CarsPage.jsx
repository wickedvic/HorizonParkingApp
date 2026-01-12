"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./CarsPage.css"

export default function CarsPage({ user, onNavigateClient }) {
  const [cars, setCars] = useState([])
  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") 

  useEffect(() => {
    loadCars()
  }, [])

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/cars`)
      const data = await res.json()
      setCars(data)
    } catch (err) {
      console.error("Failed to load cars:", err)
    }
  }

  const handleDeleteCar = async (id, plate) => {
      if (window.confirm(`Are you sure you want to delete vehicle ${plate}? This will also delete associated permits.`)) {
          try {
              const res = await fetch(`${API_BASE_URL}/api/cars/${id}`, { method: 'DELETE' });
              if (res.ok) {
                  loadCars();
              }
          } catch (err) {
              console.error("Error deleting car:", err);
          }
      }
  }

  const filteredCars = cars.filter((car) => {
    const searchText = `${car.license_plate} ${car.make} ${car.model} ${car.first_name} ${car.last_name}`.toLowerCase()
    const matchesSearch = searchText.includes(filterSearch.toLowerCase())
    const matchesStatus = filterStatus === "all" ? true : filterStatus === "active" ? car.has_active_permit === 1 : car.has_active_permit === 0;
    return matchesSearch && matchesStatus
  })

  return (
    <div className="cars-page">
      <div className="page-header">
        <h2>All Vehicles</h2>
      </div>

      <div className="filter-section">
        <input type="text" placeholder="Search by plate, make, model..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="filter-input" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active Permit</option>
            <option value="inactive">No Active Permit</option>
        </select>
      </div>

      <div className="cars-list">
        {filteredCars.length === 0 ? (
          <p className="empty-message">No vehicles found</p>
        ) : (
          <table className="cars-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Color</th>
                <th>Owner</th>
                {(user.role === "admin") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car) => (
                <tr key={car.id}>
                  <td>
                    <strong>{car.license_plate}</strong>
                    {car.has_active_permit === 1 && <span style={{ display: 'block', fontSize: '10px', color: '#155724', marginTop: '2px' }}>Active</span>}
                  </td>
                  <td>{car.make}</td>
                  <td>{car.model}</td>
                  <td>{car.year}</td>
                  <td>{car.color}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button className="btn-link" style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: '600' }} onClick={() => onNavigateClient(`${car.first_name} ${car.last_name}`)}>
                        {car.first_name} {car.last_name}
                        </button>
                        {car.outstanding_payments > 0 && (
                            <span title="Outstanding Payment Due" style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #ffcdd2' }}>! Unpaid</span>
                        )}
                    </div>
                  </td>
                  {(user.role === "admin") && (
                      <td>
                          <button className="btn-small btn-danger" onClick={() => handleDeleteCar(car.id, car.license_plate)} title="Delete Vehicle">Delete</button>
                      </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}