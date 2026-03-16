"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./ReportsPage.css"

export default function ReportsPage({ user }) {
  const [reportData, setReportData] = useState({
    totalCars: 0,
    totalPeople: 0,
    totalPermits: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [c, p, perm] = await Promise.all([
        fetch(`${API_BASE_URL}/cars`).then(res => res.json()),
        fetch(`${API_BASE_URL}/clients`).then(res => res.json()),
        fetch(`${API_BASE_URL}/permits`).then(res => res.json()),
      ])
      setReportData({
        totalCars: c.length,
        totalPeople: p.length,
        totalPermits: perm.length
      })
    } catch (err) {
      console.error("Report load failed", err)
    }
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>System Reports</h2>
      </div>

      <div className="report-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="summary-card">
          <h3>Total Vehicles</h3>
          <p className="amount">{reportData.totalCars}</p>
        </div>
        <div className="summary-card">
          <h3>Registered People</h3>
          <p className="amount">{reportData.totalPeople}</p>
        </div>
        <div className="summary-card">
          <h3>Total Permits</h3>
          <p className="amount">{reportData.totalPermits}</p>
        </div>
      </div>

      <div className="info-section" style={{ marginTop: '40px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Data Status</h3>
        <p>Database: <strong>parkingapp_data</strong></p>
        <p>Connected via: <strong>VPS (148.170.235.212)</strong></p>
      </div>
    </div>
  )
}