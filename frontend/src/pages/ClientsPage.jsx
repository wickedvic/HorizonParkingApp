"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box, Typography, Chip, List, ListItem, ListItemText, Divider,
  ToggleButton, ToggleButtonGroup, Stack, Grid, Button, Paper, Link, Tooltip,
  IconButton
} from "@mui/material";
import { 
  DirectionsCar as CarIcon, 
  Badge as PermitIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Info as InfoIcon,
  PictureAsPdf as PdfIcon // Added for PDF/Print functionality
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ClientsPage({ user, onNavigateCar, onNavigatePermit, initialFilter }) {
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => {
    loadClients(); loadAllCars();
  }, []);

  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter]);

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      console.log("CLIENT DATA", data)
      setClients(Array.isArray(data) ? data.filter(row => row.id) : []);
    } catch (err) { console.error(err); }
  };

  const loadAllCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setAllCars(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  // Function to handle the Permit Printing (PDF-like view)
  const handlePrintPermit = (client) => {
    const clientVehicles = allCars.filter(car => car.owner_id == client.id);
    const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Parking Permit - ${client.firstName} ${client.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
            .logo-placeholder { background: #444; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
            h1 { font-size: 48px; color: #d32f2f; margin: 20px 0; }
            .address { font-size: 18px; margin-bottom: 30px; }
            .permit-label { font-size: 32px; font-weight: bold; text-decoration: underline; margin-bottom: 10px; }
            .date-highlight { font-size: 56px; color: #d32f2f; font-weight: bold; margin: 20px 0; }
            .cars-info-title { text-align: left; font-size: 20px; font-weight: bold; text-decoration: underline; margin-top: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .signature-line { margin-top: 60px; text-align: right; }
            .footer-info { margin-top: 40px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-placeholder">H</div>
            <div style="font-size: 28px; font-weight: bold;">2020 Partners, LLC</div>
          </div>
          <h1>Parking Permit</h1>
          <div class="address">20 Jerusalem Ave<br/>Hicksville, NY</div>
          <div class="permit-label">Permit #: ${client.permitNumber || 'N/A'}</div>
          <div class="date-highlight">${monthYear}</div>
          
          <div class="cars-info-title">Cars Info</div>
          <table>
            <thead>
              <tr>
                <th>Car Make</th>
                <th>Model</th>
                <th>Color</th>
                <th>Year</th>
                <th>License</th>
              </tr>
            </thead>
            <tbody>
              ${clientVehicles.map(car => `
                <tr>
                  <td>${car.make || ''}</td>
                  <td>${car.model || ''}</td>
                  <td>${car.color || ''}</td>
                  <td>${car.year || ''}</td>
                  <td>${car.license_plate?.split('\r')[0] || ''}</td>
                </tr>
              `).join('')}
              ${clientVehicles.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No vehicles registered</td></tr>' : ''}
            </tbody>
          </table>
          
          <div class="signature-line">
            X __________________________________________
          </div>
          
          <div class="footer-info">
            Feel free to call with any questions: Phone: 516-328-2020
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateClient = async ({ values, table }) => {
    const permitVal = values.permitNumber || `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const feeVal = values.feeCharged || "120";
    
    const payload = { 
      ...values, 
      permitNumber: permitVal, 
      feeCharged: feeVal,
      status: values.status || 'active', // Ensure status is sent
      addedBy: user?.username || 'Sys' 
    };

    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) { loadClients(); table.setCreatingRow(null); }
    } catch (err) { console.error(err); }
  };

  const handleSaveClient = async ({ values, table }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${values.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) { loadClients(); table.setEditingRow(null); }
    } catch (err) { console.error(err); }
  };

  const displayedClients = useMemo(() => {
    return clients.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [clients, statusFilter]);

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", enableEditing: false, size: 80 },
    { accessorKey: "firstName", header: "First Name", muiEditTextFieldProps: { required: true } },
    { accessorKey: "lastName", header: "Last Name", muiEditTextFieldProps: { required: true } },
    { accessorKey: "email", header: "Email Address" },
    { accessorKey: "phone", header: "Phone" },
    { 
      accessorKey: "status", 
      header: "Status",
      editVariant: 'select',
      editSelectOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      Cell: ({ cell }) => (
        <Chip 
          label={cell.getValue()?.toUpperCase()} 
          color={cell.getValue() === 'active' ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    { 
      accessorKey: "permitNumber", 
      header: "Permit #", 
      muiEditTextFieldProps: { 
        helperText: "Permit numbers can be separated by a comma (e.g. 101, 102)",
        placeholder: "Auto-generated if left blank"
      },
      Cell: ({ cell }) => {
        const val = cell.getValue();
        if (!val) return 'N/A';
        return val.toString().split(',').map((p, i) => (
          <Chip key={i} label={p.trim()} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" color="primary" />
        ));
      }
    },
    { 
      accessorKey: "feeCharged", 
      header: "Permit Cost",
      muiEditTextFieldProps: {
        type: "number",
        label: "Fee Charged ($)",
        defaultValue: "120"
      },
      Cell: ({ cell }) => (
        <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
          ${cell.getValue() || "0"}
        </Typography>
      )
    },
    { accessorKey: "company", header: "Company" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "ST" },
    { accessorKey: "zip", header: "Zip" },
    { accessorKey: "ccNum", header: "CC #" },
    { accessorKey: "ccExp", header: "CC Exp" },
  ], []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Client Directory</Typography>
          <Typography variant="caption" color="text.secondary">
            Manage active residents, their vehicle associations, and permit billing.
          </Typography>
        </Box>
        <ToggleButtonGroup color="primary" value={statusFilter} exclusive onChange={(e, v) => v && setStatusFilter(v)} size="small">
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <MaterialReactTable
        columns={columns}
        data={displayedClients}
        editDisplayMode="modal"
        enableEditing
        onEditingRowSave={handleSaveClient}
        onCreatingRowSave={handleCreateClient}
        state={{ globalFilter }}
        onGlobalFilterChange={setGlobalFilter}
        renderTopToolbarCustomActions={({ table }) => (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => table.setCreatingRow(true)}>
            Add New Client
          </Button>
        )}
        renderRowActions={({ row, table }) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Print Permit (PDF)">
              <IconButton onClick={() => handlePrintPermit(row.original)} color="primary">
                <PdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Client Details">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        renderDetailPanel={({ row }) => {
          const clientVehicles = allCars.filter(car => car.owner_id == row.original.id);
          const permitList = (row.original.permitNumber || "").split(',').map(p => p.trim()).filter(p => p);
          return (
            <Box sx={{ p: 2, backgroundColor: '#fcfcfc' }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                    <CarIcon fontSize="small" color="primary" /> Registered Vehicles
                  </Typography>
                  <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                    {clientVehicles.length > 0 ? clientVehicles.map((car) => (
                      <ListItem key={car.id}>
                        <ListItemText 
                          primary={<Link component="button" sx={{fontWeight:'bold'}} onClick={() => onNavigateCar(car.license_plate?.split('\r')[0])}>{car.make} {car.model}</Link>} 
                          secondary={`Plate: ${car.license_plate?.split('\r')[0]}`} 
                        />
                      </ListItem>
                    )) : <ListItem><ListItemText secondary="No vehicles registered" /></ListItem>}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                    <PermitIcon fontSize="small" color="secondary" /> Permanent Permits
                  </Typography>
                  <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                    {permitList.length > 0 ? permitList.map((p, i) => (
                      <ListItem key={i}><ListItemText primary={`Permit #${p}`} /></ListItem>
                    )) : <ListItem><ListItemText secondary="No permanent permits assigned" /></ListItem>}
                  </List>
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 2, bgcolor: '#fffde7' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <InfoIcon sx={{ color: '#fbc02d', fontSize: 20 }} />
                      <Typography variant="caption">
                        <strong>Billing Info:</strong> Current Fee Charged: ${row.original.feeCharged || "0"}.
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          );
        }}
        initialState={{ 
          columnVisibility: { address: false, city: false, state: false, zip: false, ccNum: false, ccExp: false } 
        }}
      />
    </Box>
  );
}