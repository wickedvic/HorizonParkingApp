"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Collapse,
  Stack
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function PermitsPage({ user, initialFilter }) {
  const [permits, setPermits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "")

  const [formData, setFormData] = useState({
    user_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    added_by: user?.username || "Admin"
  })

  // Sync internal filter state if the prop changes (from Dashboard navigation)
  useEffect(() => {
    setGlobalFilter(initialFilter || "");
  }, [initialFilter])

  useEffect(() => {
    loadPermits()
  }, [])

  const loadPermits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/permits`)
      const data = await res.json()
      setPermits(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error("Failed to load permits:", err) 
    }
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
        setFormData({ ...formData, user_name: "" }) // Reset name
      }
    } catch (err) { 
      console.error("Failed to add permit:", err) 
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "TempPermitID",
        header: "ID",
        size: 80,
      },
      {
        accessorKey: "UserName",
        header: "User Name",
      },
      {
        accessorKey: "PermitStartDate",
        header: "Start Date",
      },
      {
        accessorKey: "PermitEndDate",
        header: "End Date",
      },
      {
        accessorKey: "AddedBy",
        header: "Added By",
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Daily Parking Permits
        </Typography>
        <Button
          variant="contained"
          startIcon={showForm ? <CloseIcon /> : <AddIcon />}
          color={showForm ? "error" : "primary"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Issue Permit"}
        </Button>
      </Stack>

      <Collapse in={showForm}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }} elevation={2}>
          <form onSubmit={handleAddPermit}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="User Name"
                variant="outlined"
                size="small"
                fullWidth
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                required
              />
              <TextField
                label="Start Date"
                type="date"
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <TextField
                label="End Date"
                type="date"
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
              <Button type="submit" variant="contained" sx={{ px: 4 }}>
                Create
              </Button>
            </Stack>
          </form>
        </Paper>
      </Collapse>

      <MaterialReactTable
        columns={columns}
        data={permits}
        state={{ globalFilter }} // This applies the permit # from the Dashboard
        onGlobalFilterChange={setGlobalFilter}
        enableColumnOrdering
        enablePinning
        initialState={{ 
          density: 'compact',
        }}
        muiTablePaperProps={{
          elevation: 2,
          sx: { borderRadius: '12px' }
        }}
      />
    </Box>
  );
}