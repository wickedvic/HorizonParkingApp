"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box, Typography, Chip, List, ListItem, ListItemText, Divider,
  ToggleButton, ToggleButtonGroup, Stack, Grid, Button, Paper, Link, Tooltip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from "@mui/material";
import { 
  DirectionsCar as CarIcon, 
  Badge as PermitIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  PictureAsPdf as PdfIcon,
  Payments as CashIcon,
  History as HistoryIcon,
  LocalParking as ParkingIcon,
  FileDownload as FileDownloadIcon 
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';
import { mkConfig, generateCsv, download } from 'export-to-csv'; 

const csvConfigBase = { fieldSeparator: ',', decimalSeparator: '.', useKeysAsHeaders: true };

export default function ClientsPage({ user, onNavigateCar, onNavigatePermit, initialFilter }) {
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', type: 'tenant', status: 'active', permitNumber: '', feeCharged: '120', id: null });

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);

  useEffect(() => {
    loadClients(); loadAllCars(); loadPayments();
  }, []);

  const normalize = (val) => val?.toString().toLowerCase().trim() || "";

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

  const handleExportByStatus = (status) => {
    const filteredData = clients.filter(c => normalize(c.status) === normalize(status));
    const config = mkConfig({ ...csvConfigBase, filename: `${status}-clients-export` });
    const csv = generateCsv(config)(filteredData);
    download(config)(csv);
  };

  const handleExportAll = () => {
    const config = mkConfig({ ...csvConfigBase, filename: 'all-clients-export' });
    const csv = generateCsv(config)(clients);
    download(config)(csv);
  };

  const handlePrintPermit = (client) => {
    const clientVehicles = allCars.filter(car => car.owner_id == client.id);
    const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Parking Permit - ${client.lastName}</title><style>body { font-family: Arial; padding: 40px; text-align: center; }.header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }.logo { background: #444; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; }h1 { font-size: 48px; color: #d32f2f; margin: 20px 0; }.address { font-size: 18px; margin-bottom: 30px; }.permit-label { font-size: 32px; font-weight: bold; text-decoration: underline; }.date-highlight { font-size: 56px; color: #d32f2f; font-weight: bold; margin: 20px 0; }table { width: 100%; border-collapse: collapse; margin-top: 10px; }th, td { border: 1px solid black; padding: 8px; text-align: left; }.signature { margin-top: 60px; text-align: right; font-size: 20px; color: #d32f2f; }</style></head>
        <body><div class="header"><div class="logo">H</div><div style="font-size: 28px; font-weight: bold;">2020 Partners, LLC</div></div><h1>Parking Permit</h1><div class="address">20 Jerusalem Ave<br/>Hicksville, NY</div><div class="permit-label">Permit #: ${client.permitNumber || ''}</div><div class="date-highlight">${monthYear}</div><div style="text-align:left; font-weight:bold; text-decoration:underline;">Cars Info</div><table><thead><tr><th>Car Make</th><th>Model</th><th>Color</th><th>Year</th><th>License</th></tr></thead><tbody>${clientVehicles.map(car => `<tr><td>${car.make}</td><td>${car.model}</td><td>${car.color}</td><td>${car.year}</td><td>${car.license_plate?.split('\r')[0]}</td></tr>`).join('')}</tbody></table><div class="signature">X __________________________________________</div><script>window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

  const handlePrintReceipt = (client) => {
    const defaultMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const selectedMonth = window.prompt("Enter the Effective Month/Year for this receipt:", defaultMonth);
    if (selectedMonth === null) return; 
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Payment Receipt - ${client.lastName}</title><style>body { font-family: Arial; padding: 50px; text-align: center; }.receipt-box { border: 1px solid black; padding: 40px; margin: 20px auto; width: 450px; text-align: left; }.header { display: flex; align-items: center; justify-content: center; margin-bottom: 5px; }.logo { background: #444; color: white; width: 40px; height: 40px; line-height: 40px; margin-right: 10px; font-weight: bold; text-align: center;}.title { font-size: 22px; font-weight: bold; border-bottom: 1px solid black; display: inline-block; margin-bottom: 30px; }.row { margin: 15px 0; font-size: 16px; display: flex; justify-content: space-between; }.value { text-decoration: underline; }.footer { margin-top: 100px; font-size: 12px; }</style></head>
      <body><div class="header"><div class="logo">H</div><div style="font-size: 20px;">20/20 Partners</div></div><div class="title">Parking Payment Receipt</div><div class="receipt-box"><div class="row"><span>Client Name:</span> <span class="value">${client.lastName}, ${client.firstName}</span></div><div class="row"><span>Permit #:</span> <span class="value">${client.permitNumber || ''}</span></div><div class="row"><span>Paid:</span> <span class="value">$${client.feeCharged || '0'}.00</span></div><div class="row"><span>Effective Month:</span> <span class="value">${selectedMonth}</span></div></div><div class="footer">Printed on: ${new Date().toLocaleString()}</div><script>window.print();</script></body></html>
    `);
    printWindow.document.close();
  };

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
            @page { size: auto; margin: 5mm; }
            body { font-family: Arial, sans-serif; padding: 15px; margin: 0; font-size: 11px; }
            .title-box { border: 1px solid black; width: 180px; margin: 0 auto 15px auto; text-align: center; font-weight: bold; padding: 4px; font-size: 14px; }
            .header-info { border: 1px solid black; padding: 8px; display: flex; justify-content: space-between; margin-bottom: 15px; }
            .logo-small { background: #444; color: white; width: 25px; text-align: center; margin-bottom: 4px; font-weight: bold; }
            .flex-container { display: flex; gap: 15px; align-items: flex-start; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 4px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="title-box">Payment History</div>
          <div class="header-info">
            <div><div class="logo-small">H</div><strong>${client.lastName}, ${client.firstName}</strong><br/>Client Type: ${client.type || 'Payer'}</div>
            <div style="text-align:right;">Method of Payment: Credit Card<br/>Monthly Fee: $${client.feeCharged || '0'}.00</div>
          </div>
          <div class="flex-container">
            <div style="flex:1;">
                <table><thead><tr><th>Month</th><th>Amount</th></tr></thead>
                <tbody>${leftCol.map(p => `<tr><td>${p.month}</td><td>$${p.amount}.00</td></tr>`).join('')}</tbody>
                </table>
            </div>
            <div style="flex:1;">
                <table><thead><tr><th>Month</th><th>Amount</th></tr></thead>
                <tbody>${rightCol.map(p => `<tr><td>${p.month}</td><td>$${p.amount}.00</td></tr>`).join('')}</tbody>
                </table>
            </div>
          </div>
          <div style="font-size: 9px; margin-top: 10px; color: #666;">Printed on: ${new Date().toLocaleString()}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleMassPayment = async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!window.confirm(`Process mass payments for ${currentMonth}? This will only charge active users with a fee greater than $0 who haven't paid yet.`)) return;
    
    try {
      // Ensure we explicitly filter out anyone with an invalid or zero fee
      const activeClients = clients.filter(c => {
        const fee = parseFloat(c.feeCharged);
        return normalize(c.status) === 'active' && !isNaN(fee) && fee > 0;
      });

      if (activeClients.length === 0) {
        alert("No active clients with a valid fee greater than $0 were found.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/process-mass-payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, clients: activeClients, addedBy: user?.id || 1 }),
      });
      const data = await res.json();
      if (res.ok) { 
        alert(`Process Complete!\nPayments Created: ${data.processed}\nAlready Paid / Skipped: ${data.skipped}`); 
        loadPayments(); 
      } else {
        alert(`Server Error: ${data.error}`);
      }
    } catch (err) { console.error(err); }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormData({ firstName: '', lastName: '', type: 'tenant', status: 'active', permitNumber: '', feeCharged: '120', id: null });
    setModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setIsEditMode(true);
    setFormData({ ...client });
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleFormSubmit = async () => {
    // 1. Validation Check: Ensure required fields are not empty
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.type || !formData.status) {
      alert("Please fill out all required fields. First Name, Last Name, Type, and Status cannot be empty.");
      return; // Stop the submission process
    }

    const url = isEditMode ? `${API_BASE_URL}/clients/${formData.id}` : `${API_BASE_URL}/clients`;
    const method = isEditMode ? "PUT" : "POST";
    
    const payload = isEditMode ? formData : {
        ...formData,
        address: "", city: "", state: "", zip: "", phone: "", email: "", company: "",
        ccNum: "", ccExp: "",
        addedBy: user?.id || 1 
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadClients();
        handleCloseModal();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) { console.error(err); }
  };

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", size: 80 },
    { accessorKey: "firstName", header: "First Name" },
    { accessorKey: "lastName", header: "Last Name" },
    { accessorKey: "type", header: "Type", Cell: ({ cell }) => <Chip label={cell.getValue()?.toUpperCase()} variant="outlined" size="small" /> },
    { accessorKey: "status", header: "Status", Cell: ({ cell }) => (<Chip label={cell.getValue()?.toUpperCase()} color={normalize(cell.getValue()) === 'active' ? 'success' : 'default'} size="small" />) },
    { accessorKey: "permitNumber", header: "Permit #" },
    { accessorKey: "feeCharged", header: "Cost", Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>${cell.getValue() || "0"}</Typography> },
  ], []);

  const displayedClients = useMemo(() => clients.filter(c => normalize(c.status) === normalize(statusFilter)), [clients, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Client Directory</Typography>
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
        enableRowActions
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '10px' }}>
            {/* FIX: Hide Add Client Button if user is not admin */}
            {user?.role === 'admin' && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add New Client</Button>
            )}
            <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('active')} variant="outlined" size="small" color="success">Export Active</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('inactive')} variant="outlined" size="small" color="error">Export Inactive</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={handleExportAll} variant="outlined" size="small">Export All</Button>
          </Box>
        )}
        renderRowActions={({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Parking Permit"><IconButton onClick={() => handlePrintPermit(row.original)} color="error"><ParkingIcon /></IconButton></Tooltip>
            <Tooltip title="Monthly Receipt"><IconButton onClick={() => handlePrintReceipt(row.original)} color="primary"><PdfIcon /></IconButton></Tooltip>
            <Tooltip title="Payment History"><IconButton onClick={() => handlePrintHistory(row.original)} color="info"><HistoryIcon /></IconButton></Tooltip>
            
            {/* FIX: Hide Edit Client Button if user is not admin */}
            {user?.role === 'admin' && (
              <Tooltip title="Edit"><IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton></Tooltip>
            )}
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
                  <Paper variant="outlined" sx={{p:2}}>Fee: ${row.original.feeCharged || '0'}.00<br/>Permits: {row.original.permitNumber || 'None'}</Paper>
                </Grid>
              </Grid>
            </Box>
          );
        }}
      />

      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontWeight:'bold', borderBottom: '1px solid #eee', mb: 2}}>
            {isEditMode ? "Edit Client" : "Add New Client"}
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="First Name" 
                      value={formData.firstName} 
                      error={formData.firstName === ""}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="Last Name" 
                      value={formData.lastName} 
                      error={formData.lastName === ""}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField select fullWidth required label="Type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                        <MenuItem value="tenant">Tenant</MenuItem><MenuItem value="employee">Employee</MenuItem><MenuItem value="payer">Payer</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField select fullWidth required label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Permit #" value={formData.permitNumber} onChange={(e) => setFormData({...formData, permitNumber: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Cost" type="number" value={formData.feeCharged} onChange={(e) => setFormData({...formData, feeCharged: e.target.value})} />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{p: 3}}>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button variant="contained" onClick={handleFormSubmit}>{isEditMode ? "Save Changes" : "Create Client"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}