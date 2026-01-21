"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./PaymentsPage.css"

export default function PaymentsPage({ user, onUpdate }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [filterSearch, setFilterSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`)
      const data = await res.json()
      setPayments(data)
    } catch (err) {
      console.error("Failed to load payments:", err)
    }
  }

  const handleDeletePayment = async (id) => {
      if (window.confirm("Are you sure you want to delete this payment record?")) {
          try {
              const res = await fetch(`${API_BASE_URL}/payments/${id}`, { method: 'DELETE' });
              if (res.ok) {
                  loadPayments();
                  onUpdate();
              }
          } catch (err) {
              console.error("Error deleting payment:", err);
          }
      }
  }

  const handleMarkPaid = async (paymentId) => {
    if (user.role !== "admin") {
      alert("Only admins can mark payments as paid")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paid: true }),
      })
      if (res.ok) {
        loadPayments()
        onUpdate()
      }
    } catch (err) {
      console.error("Failed to update payment:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkUnpaid = async (paymentId) => {
    if (user.role !== "admin") {
      alert("Only admins can mark payments as unpaid")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paid: false }),
      })
      if (res.ok) {
        loadPayments()
        onUpdate()
      }
    } catch (err) {
      console.error("Failed to update payment:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMonthly = async () => {
    if (!confirm("Are you sure you want to generate invoices for all active monthly permits for this month?")) return
    setGenerating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/generate-monthly`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        loadPayments()
        onUpdate()
      } else {
        alert("Error generating invoices: " + data.error)
      }
    } catch (err) {
      console.error("Failed to generate invoices:", err)
      alert("Failed to connect to server")
    } finally {
      setGenerating(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const searchText = `${payment.first_name} ${payment.last_name} ${payment.permit_number}`.toLowerCase()
    const matchesSearch = searchText.includes(filterSearch.toLowerCase())
    const matchesStatus = filterStatus === "" || (filterStatus === "paid" ? payment.is_paid : !payment.is_paid)
    let matchesMonth = true
    if (filterMonth) {
      const paymentDate = new Date(payment.created_at)
      if (!isNaN(paymentDate)) {
        const paymentMonthStr = paymentDate.toISOString().slice(0, 7)
        matchesMonth = paymentMonthStr === filterMonth
      }
    }
    return matchesSearch && matchesStatus && matchesMonth
  })

  const paidTotal = filteredPayments.filter((p) => p.is_paid).reduce((sum, p) => sum + p.amount, 0)
  const pendingTotal = filteredPayments.filter((p) => !p.is_paid).reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>Payment Management</h2>
        {user.role === "admin" && (
          <button className="btn-primary" onClick={handleGenerateMonthly} disabled={generating}>
            {generating ? "Generating..." : "Generate Monthly Invoices"}
          </button>
        )}
      </div>

      <div className="filter-section">
        <input type="text" placeholder="Search by client or permit..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="filter-input" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="filter-select" title="Filter by Invoice Month" />
        <button className="btn-secondary" onClick={() => setFilterMonth("")} title="Clear Month Filter">Clear</button>
      </div>

      <div className="payment-summary">
        <div className="summary-card"><h3>Paid</h3><p className="amount">${paidTotal.toFixed(2)}</p></div>
        <div className="summary-card"><h3>Pending</h3><p className="amount">${pendingTotal.toFixed(2)}</p></div>
        <div className="summary-card"><h3>Total</h3><p className="amount">${(paidTotal + pendingTotal).toFixed(2)}</p></div>
      </div>

      <div className="payments-list">
        {filteredPayments.length === 0 ? (
          <p className="empty-message">No payments found for this period</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Invoice Date</th>
                <th>Permit #</th>
                <th>Permit Duration</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className={payment.is_paid ? "paid" : "pending"}>
                  <td>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "-"}</td>
                  <td>{payment.permit_number}</td>
                  <td><div style={{display: 'flex', flexDirection: 'column', fontSize: '13px'}}><span>Start: {payment.start_date}</span><span style={{color: '#666'}}>End: {payment.end_date}</span></div></td>
                  <td>{payment.first_name} {payment.last_name}</td>
                  <td>${payment.amount.toFixed(2)}</td>
                  <td><span className={`status ${payment.is_paid ? "paid" : "pending"}`}>{payment.is_paid ? "Paid" : "Pending"}</span></td>
                  <td>{payment.paid_date ? new Date(payment.paid_date).toLocaleDateString() : "-"}</td>
                  <td>
                    {user.role === "admin" && (
                        <div style={{display: 'flex', gap: '5px'}}>
                            {!payment.is_paid ? (
                                <button className="btn-small" onClick={() => handleMarkPaid(payment.id)} disabled={loading}>Mark Paid</button>
                            ) : (
                                <button className="btn-small btn-danger" onClick={() => handleMarkUnpaid(payment.id)} disabled={loading}>Mark Unpaid</button>
                            )}
                            <button className="btn-small btn-danger" onClick={() => handleDeletePayment(payment.id)} disabled={loading} title="Delete Record">×</button>
                        </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}