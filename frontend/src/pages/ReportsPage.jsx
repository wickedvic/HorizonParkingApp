"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./ReportsPage.css"

export default function ReportsPage({ user }) {
  const [reports, setReports] = useState([])
  
  // Calculate current month's start and end date for default state
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)

  const loadReports = async (start, end) => {
    try {
      let url = `${API_BASE_URL}/reports`
      // Use arguments if provided, otherwise use state
      const s = start !== undefined ? start : startDate;
      const e = end !== undefined ? end : endDate;

      if (s && e) {
        url += `?startDate=${s}&endDate=${e}`
      }
      const res = await fetch(url)
      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to load reports:", res.status, errorText)
        setReports([])
        return
      }
      const data = await res.json()
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load reports:", err)
      setReports([])
    }
  }

  useEffect(() => {
    // Load with the default current month dates
    loadReports(firstDay, lastDay)
  }, [])

  const handleFilter = () => {
    loadReports()
  }

  const totalPaid = reports.reduce((sum, r) => sum + (r.total_paid || 0), 0)
  const totalPending = reports.reduce((sum, r) => sum + (r.total_pending || 0), 0)

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleFilter}>
          Filter
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setStartDate("")
            setEndDate("")
            loadReports("", "")
          }}
        >
          Clear
        </button>
      </div>

      <div className="report-summary">
        <div className="summary-card">
          <h3>Total Paid</h3>
          <p className="amount">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Pending</h3>
          <p className="amount">${totalPending.toFixed(2)}</p>
        </div>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <p className="empty-message">No data found</p>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Client Type</th>
                <th>Vehicles</th>
                <th>Permits</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    {report.first_name} {report.last_name}
                  </td>
                  <td>
                    <span style={{
                        textTransform: 'capitalize',
                        padding: '2px 8px',
                        backgroundColor: report.client_type === 'employee' ? '#e6f7ff' : '#fff7e6',
                        color: report.client_type === 'employee' ? '#0050b3' : '#d46b08',
                        borderRadius: '4px',
                        fontSize: '12px'
                    }}>
                        {report.client_type}
                    </span>
                  </td>
                  <td>{report.car_count || 0}</td>
                  <td>{report.permit_count || 0}</td>
                  <td className="amount">${(report.total_paid || 0).toFixed(2)}</td>
                  <td className="amount">${(report.total_pending || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}