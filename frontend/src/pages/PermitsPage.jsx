"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./PermitsPage.css"

export default function PermitsPage({ user }) {
  const [permits, setPermits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [cars, setCars] = useState([])
  const [formData, setFormData] = useState({
    user_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    added_by: user.username
  })

  useEffect(() => {
    loadPermits()
  }, [])

  const loadPermits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/permits`)
      const data = await res.json()
      setPermits(data)
    } catch (err) { console.error("Failed to load permits:", err) }
  }

  const handleAddPermit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API_BASE_URL}/permits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        loadPermits()
        setShowForm(false)
      }
    } catch (err) { console.error("Failed to add permit:", err) }
  }

  return (
    <div className="permits-page">
      <div className="page-header">
        <h2>Daily Parking Permits</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Issue Permit"}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <form onSubmit={handleAddPermit} className="permit-form">
            <input type="text" placeholder="User Name" value={formData.user_name} onChange={(e) => setFormData({ ...formData, user_name: e.target.value })} required />
            <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
            <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      <table className="permits-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Start</th>
            <th>End</th>
            <th>Added By</th>
          </tr>
        </thead>
        <tbody>
          {permits.map((permit) => (
            <tr key={permit.TempPermitID}>
              <td>{permit.TempPermitID}</td>
              <td>{permit.UserName}</td>
              <td>{permit.PermitStartDate}</td>
              <td>{permit.PermitEndDate}</td>
              <td>{permit.AddedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}