"use client"

import { useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import "./PaymentsPage.css"

export default function PaymentsPage({ user }) {
  const [payments, setPayments] = useState([])

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setPayments(data)
      } else {
        setPayments([])
      }
    } catch (err) {
      console.error("Failed to load payments:", err)
      setPayments([])
    }
  }

  const safePayments = Array.isArray(payments) ? payments : []
  const totalReceived = safePayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>Billing & Payments</h2>
      </div>

      <div className="payment-summary">
        <div className="summary-card success">
          <h3>Total Revenue</h3>
          <p className="amount">${totalReceived.toFixed(2)}</p>
        </div>
      </div>

      <div className="payments-list">
        {safePayments.length === 0 ? (
          <p className="empty-message">No payment records found</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Date Added</th>
                <th>Payer ID</th>
                <th>For Month</th>
                <th>Amount</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {safePayments.map((p, index) => (
                <tr key={p.id || index}>
                  <td>{p.created_at || "N/A"}</td>
                  <td><strong>{p.payer}</strong></td>
                  <td>{p.month}</td>
                  <td>${(p.amount || 0).toFixed(2)}</td>
                  <td>{p.added_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}