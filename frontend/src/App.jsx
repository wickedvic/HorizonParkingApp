"use client"

import { useState, useEffect } from "react"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import "./App.css"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        localStorage.removeItem("user")
        setUser(null)
      }}
    />
  )
}

export default App
