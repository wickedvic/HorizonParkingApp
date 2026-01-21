"use client"

import { useState } from "react"
import API_BASE_URL from "../api"
import "./LoginPage.css"

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, 
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        setError("Invalid username or password")
        setLoading(false)
        return
      }

      const user = await res.json()
      localStorage.setItem("user", JSON.stringify(user))
      onLogin(user)
    } catch (err) {
      setError("Login failed: " + err.message)
      setLoading(false)
    }
  }

  const demoLogin = async (user, pwd) => {
    setUsername(user)
    setPassword(pwd)
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pwd }),
    })
    if (res.ok) {
      const userData = await res.json()
      localStorage.setItem("user", JSON.stringify(userData))
      onLogin(userData)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Parking Management System</h1>
        <p className="subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="demo-section">
          <p>Demo Accounts</p>
          <button type="button" className="btn-demo" onClick={() => demoLogin("artie", "2020")} disabled={loading}>
            Admin (artie / 2020)
          </button>
          <button type="button" className="btn-demo" onClick={() => demoLogin("frontdesk", "1234")} disabled={loading}>
            Front Desk (frontdesk / 1234)
          </button>
        </div>
      </div>
    </div>
  )
}
