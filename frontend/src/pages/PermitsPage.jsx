"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box, Button, Typography, Paper, TextField, Collapse, Stack, Divider, IconButton, Tooltip
} from "@mui/material";
import { 
  Add as AddIcon, 
  Close as CloseIcon, 
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Print as PrintIcon
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function PermitsPage({ user, initialFilter }) {
  const [permits, setPermits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "")

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  
  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });

  const [formData, setFormData] = useState({
    user_name: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    added_by: user?.username?.substring(0, 3).toUpperCase() || "ADM"
  })

  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter])
  useEffect(() => { loadPermits() }, [])

  const loadPermits = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/permits`)
      const data = await res.json()
      setPermits(Array.isArray(data) ? data : [])
    } catch (err) { console.error("Failed to load permits:", err) }
  }

  const handleDeletePermit = async (tempPermitId) => {
    if (!window.confirm("Are you sure you want to delete this permit record?")) return;
    try {
      // Corrected parameter to use the actual database ID
      const res = await fetch(`${API_BASE_URL}/permits/${tempPermitId}`, { method: "DELETE" });
      if (res.ok) loadPermits();
    } catch (err) { console.error(err); }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "Invalid";
    return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePrintPermit = (permit) => {
    // Generate formatted date range for the heading
    const rangeText = `${formatDate(permit.PermitStartDate)} - ${formatDate(permit.PermitEndDate)}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Parking Permit - ${permit.UserName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
            .logo { background: #444; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; font-size: 24px; }
            h1 { font-size: 72px; color: #d32f2f; margin: 20px 0; font-weight: bold; }
            .address { font-size: 22px; margin-bottom: 30px; font-weight: bold; }
            .permit-label { font-size: 40px; font-weight: bold; text-decoration: underline; }
            .date-highlight { font-size: 48px; color: #d32f2f; font-weight: bold; margin: 30px 0; }
            .signature { margin-top: 100px; text-align: right; font-size: 24px; color: #d32f2f; }
            .footer-info { margin-top: 60px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header"><div class="logo">H</div><div style="font-size: 32px; font-weight: bold;">2020 Partners, LLC</div></div>
          <h1>Parking Permit</h1>
          <div class="address">20 Jerusalem Ave<br/>Hicksville, NY</div>
          <div class="permit-label">Permit #: ${permit.PermitDate || 'TEMP'}</div>
          <div class="date-highlight">${rangeText}</div>
          <div style="text-align:left; font-size: 20px; margin-top: 20px;">
            Valid For: <strong>${permit.UserName}</strong>
          </div>
          <div class="signature">X __________________________________________</div>
          <div class="footer-info">Feel Free to call with any questions: Phone: 516-328-2020</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddPermit = async (e) => {
    e.preventDefault()
    const generatedPermitNum = `T-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const payload = { ...formData, permit_number: generatedPermitNum };

    try {
      const res = await fetch(`${API_BASE_URL}/permits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        // Prepare data for printing based on what was just created
        const newPermitData = {
          UserName: formData.user_name,
          PermitStartDate: formData.start_date,
          PermitEndDate: formData.end_date,
          PermitDate: generatedPermitNum
        };
        
        loadPermits()
        setShowForm(false)
        setFormData({ ...formData, user_name: "" })
        
        // Auto-open PDF after successful creation
        handlePrintPermit(newPermitData);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Server error'}`);
      }
    } catch (err) { console.error(err) }
  }

  const filteredPermits = useMemo(() => {
    return permits.filter(p => {
      if (!p.PermitStartDate) return false;
      const dateObj = new Date(p.PermitStartDate);
      if (isNaN(dateObj.getTime())) return false;
      const pDate = dateObj.toISOString().split("T")[0];
      return pDate >= dateRange.start && pDate <= dateRange.end;
    });
  }, [permits, dateRange]);

  const columns = useMemo(() => [
    { accessorKey: "PermitDate", header: "Permit #", size: 120 },
    { accessorKey: "UserName", header: "Name" },
    { accessorKey: "PermitStartDate", header: "Start", Cell: ({ cell }) => formatDate(cell.getValue()) },
    { accessorKey: "PermitEndDate", header: "End", Cell: ({ cell }) => formatDate(cell.getValue()) },
    { accessorKey: "AddedBy", header: "Issued By" },
  ], []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Daily Parking Permits</Typography>
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
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Issue New Temporary Permit</Typography>
          <form onSubmit={handleAddPermit}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Full Name" variant="outlined" size="small" fullWidth value={formData.user_name} onChange={(e) => setFormData({ ...formData, user_name: e.target.value })} required />
              <TextField label="Valid From" type="date" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
              <TextField label="Valid Until" type="date" variant="outlined" size="small" fullWidth InputLabelProps={{ shrink: true }} value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} required />
              <Button type="submit" variant="contained" sx={{ px: 4 }}>Create</Button>
            </Stack>
          </form>
        </Paper>
      </Collapse>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterIcon color="action" />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Filter:</Typography>
          <TextField type="date" size="small" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
          <TextField type="date" size="small" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
          <Button size="small" onClick={() => setDateRange({ start: firstDay, end: lastDay })}>Current Month</Button>
        </Stack>
      </Paper>

      <MaterialReactTable
        columns={columns}
        data={filteredPermits}
        state={{ globalFilter }}
        onGlobalFilterChange={setGlobalFilter}
        enableRowActions
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title="Print Permit"><IconButton onClick={() => handlePrintPermit(row.original)} color="primary"><PrintIcon /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton onClick={() => handleDeletePermit(row.original.TempPermitID)} color="error"><DeleteIcon /></IconButton></Tooltip>
          </Box>
        )}
        initialState={{ density: 'compact' }}
        muiTablePaperProps={{ elevation: 2, sx: { borderRadius: '12px' } }}
      />
    </Box>
  );
}