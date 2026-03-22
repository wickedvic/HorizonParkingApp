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
  PictureAsPdf as PdfIcon,
  Payments as CashIcon,
  History as HistoryIcon,
  LocalParking as ParkingIcon
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ClientsPage({ user, onNavigateCar, onNavigatePermit, initialFilter }) {
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => {
    loadClients(); loadAllCars(); loadPayments();
  }, []);

  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter]);

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
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

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  }

  // --- PDF 1: PARKING PERMIT ---
  const handlePrintPermit = (client) => {
    const clientVehicles = allCars.filter(car => car.owner_id == client.id);
    const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Parking Permit - ${client.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
            .logo { background: #444; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }
            h1 { font-size: 48px; color: #d32f2f; margin: 20px 0; }
            .address { font-size: 18px; margin-bottom: 30px; }
            .permit-label { font-size: 32px; font-weight: bold; text-decoration: underline; }
            .date-highlight { font-size: 56px; color: #d32f2f; font-weight: bold; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            .signature { margin-top: 60px; text-align: right; font-size: 20px; color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="header"><div class="logo">H</div><div style="font-size: 28px; font-weight: bold;">2020 Partners, LLC</div></div>
          <h1>Parking Permit</h1>
          <div class="address">20 Jerusalem Ave<br/>Hicksville, NY</div>
          <div class="permit-label">Permit #: ${client.permitNumber || ''}</div>
          <div class="date-highlight">${monthYear}</div>
          <div style="text-align:left; font-weight:bold; text-decoration:underline;">Cars Info</div>
          <table>
            <thead><tr><th>Car Make</th><th>Model</th><th>Color</th><th>Year</th><th>License</th></tr></thead>
            <tbody>
              ${clientVehicles.map(car => `<tr><td>${car.make}</td><td>${car.model}</td><td>${car.color}</td><td>${car.year}</td><td>${car.license_plate?.split('\r')[0]}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="signature">X __________________________________________</div>
          <div style="margin-top:40px;">Feel free to call with any questions: Phone: 516-328-2020</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- PDF 2: PAYMENT RECEIPT (Choose Month) ---
  const handlePrintReceipt = (client) => {
    const defaultMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const selectedMonth = window.prompt("Enter the Effective Month/Year for this receipt:", defaultMonth);
    
    if (selectedMonth === null) return; // User cancelled

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${client.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
            .receipt-box { border: 1px solid black; padding: 40px; margin: 20px auto; width: 450px; text-align: left; }
            .header { display: flex; align-items: center; justify-content: center; margin-bottom: 5px; }
            .logo { background: #444; color: white; width: 40px; height: 40px; line-height: 40px; margin-right: 10px; font-weight: bold; text-align: center;}
            .title { font-size: 22px; font-weight: bold; border-bottom: 1px solid black; display: inline-block; margin-bottom: 30px; }
            .row { margin: 15px 0; font-size: 16px; display: flex; justify-content: space-between; }
            .value { text-decoration: underline; }
            .footer { margin-top: 100px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header"><div class="logo">H</div><div style="font-size: 20px;">20/20 Partners</div></div>
          <div class="title">Parking Payment Receipt</div>
          <div class="receipt-box">
            <div class="row"><span>Client Name:</span> <span class="value">${client.lastName}, ${client.firstName}</span></div>
            <div class="row"><span>Permit #:</span> <span class="value">${client.permitNumber || ''}</span></div>
            <div class="row"><span>Paid:</span> <span class="value">$${client.feeCharged || '0'}.00</span></div>
            <div class="row"><span>Effective Month:</span> <span class="value">${selectedMonth}</span></div>
          </div>
          <div class="footer">Printed on: ${new Date().toLocaleString()}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- PDF 3: PAYMENT HISTORY ---
  const handlePrintHistory = (client) => {
    const clientPayments = payments.filter(p => p.payer == client.id);
    const mid = Math.ceil(clientPayments.length / 2);
    const leftCol = clientPayments.slice(0, mid);
    const rightCol = clientPayments.slice(mid);
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <html>
        <head>
          <title>Payment History - ${client.lastName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; }
            .title-box { border: 1px solid black; width: 200px; margin: 0 auto 20px auto; text-align: center; font-weight: bold; padding: 5px; }
            .header-info { border: 1px solid black; padding: 10px; display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; }
            .flex-container { display: flex; gap: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid black; padding: 4px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="title-box">Payment History</div>
          <div class="header-info">
            <div><div style="background:#444;color:white;width:30px;text-align:center;margin-bottom:5px;">H</div>${client.lastName}, ${client.firstName}<br/>Client Type: ${client.type || 'Payer'}</div>
            <div style="text-align:right;">Method of Payment: ${client.paymentType || 'Credit Card'}<br/>Monthly Fee: $${client.feeCharged || '0'}.00</div>
          </div>
          <div class="flex-container">
            <div style="flex:1;"><table><thead><tr><th>Payment Month</th><th>Amount</th></tr></thead><tbody>${leftCol.map(p => `<tr><td>${p.month}</td><td>$${p.amount}.00</td></tr>`).join('')}</tbody></table></div>
            <div style="flex:1;"><table><thead><tr><th>Payment Month</th><th>Amount</th></tr></thead><tbody>${rightCol.map(p => `<tr><td>${p.month}</td><td>$${p.amount}.00</td></tr>`).join('')}</tbody></table></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleMassPayment = async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!window.confirm(`Process mass payments for ${currentMonth}?`)) return;
    try {
      const logRes = await fetch(`${API_BASE_URL}/mass-payments-log`);
      const logs = await logRes.json();
      if (logs.some(log => log.MonthProcessed === currentMonth)) {
        alert(`Already processed for ${currentMonth}.`); return;
      }
      const activeClients = clients.filter(c => c.status === 'active');
      const res = await fetch(`${API_BASE_URL}/process-mass-payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, clients: activeClients, addedBy: user?.username }),
      });
      if (res.ok) { alert("Payments processed."); loadPayments(); }
    } catch (err) { console.error(err); }
  };

  const handleCreateClient = async ({ values, table }) => {
    const permitVal = values.permitNumber || `P-${Math.floor(1000 + Math.random() * 9000)}`;
    const feeVal = values.feeCharged || "120";
    const payload = { ...values, permitNumber: permitVal, feeCharged: feeVal, status: values.status || 'active', addedBy: user?.username || 'Sys' };
    try {
      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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

  const displayedClients = useMemo(() => clients.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase()), [clients, statusFilter]);

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", enableEditing: false, size: 80 },
    { accessorKey: "firstName", header: "First Name", muiEditTextFieldProps: { required: true } },
    { accessorKey: "lastName", header: "Last Name", muiEditTextFieldProps: { required: true } },
    { accessorKey: "status", header: "Status", editVariant: 'select', editSelectOptions: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }],
      Cell: ({ cell }) => <Chip label={cell.getValue()?.toUpperCase()} color={cell.getValue() === 'active' ? 'success' : 'default'} size="small" />
    },
    { accessorKey: "permitNumber", header: "Permit #", Cell: ({ cell }) => cell.getValue() ? cell.getValue().split(',').map((p, i) => <Chip key={i} label={p.trim()} size="small" sx={{ mr: 0.5 }} variant="outlined" color="primary" />) : 'N/A' },
    { accessorKey: "feeCharged", header: "Cost", Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>${cell.getValue() || "0"}</Typography> },
  ], []);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box><Typography variant="h4" sx={{ fontWeight: 'bold' }}>Client Directory</Typography></Box>
        <Stack direction="row" spacing={2}>
          {user?.role === 'admin' && <Button variant="outlined" color="success" startIcon={<CashIcon />} onClick={handleMassPayment}>Run Mass Payment</Button>}
          <ToggleButtonGroup color="primary" value={statusFilter} exclusive onChange={(e, v) => v && setStatusFilter(v)} size="small">
            <ToggleButton value="active">Active</ToggleButton>
            <ToggleButton value="inactive">Inactive</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
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
        renderTopToolbarCustomActions={({ table }) => (<Button variant="contained" startIcon={<AddIcon />} onClick={() => table.setCreatingRow(true)}>Add Client</Button>)}
        renderRowActions={({ row, table }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Parking Permit"><IconButton onClick={() => handlePrintPermit(row.original)} color="error"><ParkingIcon /></IconButton></Tooltip>
            <Tooltip title="Monthly Receipt"><IconButton onClick={() => handlePrintReceipt(row.original)} color="primary"><PdfIcon /></IconButton></Tooltip>
            <Tooltip title="Payment History"><IconButton onClick={() => handlePrintHistory(row.original)} color="info"><HistoryIcon /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton onClick={() => table.setEditingRow(row)}><EditIcon /></IconButton></Tooltip>
          </Stack>
        )}
        renderDetailPanel={({ row }) => {
          const clientVehicles = allCars.filter(car => car.owner_id == row.original.id);
          return (
            <Box sx={{ p: 2, backgroundColor: '#fcfcfc' }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{fontWeight:'bold'}}><CarIcon fontSize="small" /> Vehicles</Typography>
                  <List sx={{ bgcolor: 'background.paper', border: '1px solid #eee' }}>{clientVehicles.map((car) => (<ListItem key={car.id}><ListItemText primary={`${car.make} ${car.model}`} secondary={`Plate: ${car.license_plate?.split('\r')[0]}`} /></ListItem>))}</List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{fontWeight:'bold'}}><PermitIcon fontSize="small" /> Billing</Typography>
                  <Paper variant="outlined" sx={{p:2}}>Fee: $${row.original.feeCharged || '0'}.00<br/>Permits: ${row.original.permitNumber || 'None'}</Paper>
                </Grid>
              </Grid>
            </Box>
          );
        }}
      />
    </Box>
  );
}