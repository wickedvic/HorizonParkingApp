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
  Stack,
  Divider
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon, FilterList as FilterIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function PermitsPage({ user, initialFilter }) {
  const [permits, setPermits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "")

  // DATE RANGE STATE: Default to the first and last day of the current month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  
  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });

  const [formData, setFormData] = useState({
    user_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    added_by: user?.username || "Admin"
  })

  useEffect(() => {
    setGlobalFilter(initialFilter || "");
  }, [initialFilter])

  useEffect(() => {
    loadPermits()
  }, []) // Initial load

  const loadPermits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/permits`)
      const data = await res.json()
      setPermits(Array.isArray(data) ? data : [])
    } catch (err) { 
      console.error("Failed to load permits:", err) 
    }
  }

  // Filter logic for the table data
  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      // Standardize the permit date for comparison
      const pDate = new Date(p.PermitStartDate).toISOString().split("T")[0];
      return pDate >= dateRange.start && pDate <= dateRange.end;
    });
  }, [permits, dateRange]);

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
        setFormData({ ...formData, user_name: "" })
      }
    } catch (err) { console.error(err) }
  }

  // Helper to make dates look professional (e.g., Mar 16, 2026)
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const columns = useMemo(
    () => [
      { accessorKey: "TempPermitID", header: "ID", size: 80 },
      { accessorKey: "UserName", header: "User Name" },
      { 
        accessorKey: "PermitStartDate", 
        header: "Start Date",
        Cell: ({ cell }) => formatDate(cell.getValue()) 
      },
      { 
        accessorKey: "PermitEndDate", 
        header: "End Date",
        Cell: ({ cell }) => formatDate(cell.getValue()) 
      },
      { accessorKey: "AddedBy", header: "Added By" },
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

      {/* ISSUE PERMIT FORM */}
      <Collapse in={showForm}>
        <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }} elevation={2}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>New Permit Entry</Typography>
          <form onSubmit={handleAddPermit}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="User Name"
                variant="outlined" size="small" fullWidth
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                required
              />
              <TextField
                label="Start" type="date" variant="outlined" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
              <TextField
                label="End" type="date" variant="outlined" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
              <Button type="submit" variant="contained" sx={{ px: 4 }}>Create</Button>
            </Stack>
          </form>
        </Paper>
      </Collapse>

      {/* DATE RANGE TOGGLE BOX */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterIcon color="action" />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>View Permits From:</Typography>
          <TextField
            type="date" size="small" label="From" InputLabelProps={{ shrink: true }}
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <TextField
            type="date" size="small" label="To" InputLabelProps={{ shrink: true }}
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <Divider orientation="vertical" flexItem />
          <Button size="small" onClick={() => setDateRange({ start: firstDay, end: lastDay })}>
            Reset to Current Month
          </Button>
        </Stack>
      </Paper>

      <MaterialReactTable
        columns={columns}
        data={filteredPermits}
        state={{ globalFilter }}
        onGlobalFilterChange={setGlobalFilter}
        enableColumnOrdering
        initialState={{ density: 'compact' }}
        muiTablePaperProps={{ elevation: 2, sx: { borderRadius: '12px' } }}
      />
    </Box>
  );
}