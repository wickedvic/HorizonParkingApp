"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import Swal from 'sweetalert2';
import { BeatLoader } from "react-spinners" 
import {
  Box, Typography, Chip, List, ListItem, ListItemText, Divider,
  ToggleButton, ToggleButtonGroup, Stack, Grid, Button, Paper, Link, Tooltip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Autocomplete,
  Backdrop
} from "@mui/material";
import { 
  DirectionsCar as CarIcon, 
  Badge as PermitIcon, 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  PictureAsPdf as PdfIcon,
  Payments as CashIcon,
  History as HistoryIcon,
  LocalParking as ParkingIcon,
  FileDownload as FileDownloadIcon 
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';
import { mkConfig, generateCsv, download } from 'export-to-csv'; 

const csvConfigBase = { fieldSeparator: ',', decimalSeparator: '.', useKeysAsHeaders: true };

const ModalSwal = Swal.mixin({
  didOpen: () => {
    const container = Swal.getContainer();
    if (container) {
      container.style.zIndex = '1400';
    }
  }
});

// FIX: Added a mapping dictionary for the UI display of Client Types
const clientTypeDisplayMap = {
  'tenant': 'Bank of America',
  'employee': 'Horizon',
  'payer': 'Payer'
};

export default function ClientsPage({ user, onNavigateCar, onNavigatePermit, initialFilter }) {
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [isLoading, setIsLoading] = useState(true); 
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', type: 'tenant', status: 'active', permitNumber: '', feeCharged: '0', id: null });

  // --- NEW MULTI-STEP FLOW STATES ---
  const [flowMode, setFlowMode] = useState('client-only'); 
  const [flowStep, setFlowStep] = useState(1); 
  const [newlyCreatedClientId, setNewlyCreatedClientId] = useState(null);
  const [carFlowType, setCarFlowType] = useState('new'); 
  const [carFormData, setCarFormData] = useState({ license_plate: '', make: '', model: '', year: '', color: '', existing_car_id: '' });

  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      loadClients(), 
      loadAllCars(), 
      loadPayments(),
      new Promise(resolve => setTimeout(resolve, 1000))
    ]).finally(() => {
        setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    setGlobalFilter(initialFilter || "");
  }, [initialFilter]);

  const normalize = (val) => val?.toString().toLowerCase().trim() || "";

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data.filter(row => row.id) : []);
    } catch (err) { 
      console.error(err); 
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong loading clients! Please try again in a few minutes.",
      });
    }
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

  const handleDeleteClient = (id, name) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete client: ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
          if (res.ok) {
            loadClients();
            Swal.fire("Deleted!", "The client has been removed.", "success");
          } else {
            const err = await res.json();
            Swal.fire({ icon: "error", title: "Oops...", text: `Error deleting client: ${err.error}` });
          }
        } catch (err) { 
          console.error("Error deleting client:", err); 
          Swal.fire({ icon: "error", title: "Oops...", text: "Something went wrong! Please try again in a few minutes." });
        }
      } else if (result.isDismissed) {
        Swal.fire("Cancelled", "Changes were not saved.", "info");
      }
    });
  };

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
        <head>
            <title>Parking Permit - ${client.lastName}</title>
            <style>
                body { font-family: Arial; padding: 40px; text-align: center; }
                .header { border-bottom: 2px solid black; padding-bottom: 15px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; }
                .logo-img { height: 50px; width: 50px; object-fit: contain; margin-right: 15px; border-radius: 4px; }
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
            <div class="header">
                <img src="${window.location.origin}/HHLogo.png" class="logo-img" alt="Horizon Logo" />
                <div style="font-size: 28px; font-weight: bold;">2020 Partners, LLC</div>
            </div>
            <h1>Parking Permit</h1>
            <div class="address">20 Jerusalem Ave<br/>Hicksville, NY</div>
            <div class="permit-label">Permit #: ${client.permitNumber || ''}</div>
            <div class="date-highlight">${monthYear}</div>
            <div style="text-align:left; font-weight:bold; text-decoration:underline;">Cars Info</div>
            <table>
                <thead><tr><th>Car Make</th><th>Model</th><th>Color</th><th>Year</th><th>License</th></tr></thead>
                <tbody>${clientVehicles.map(car => `<tr><td>${car.make}</td><td>${car.model}</td><td>${car.color}</td><td>${car.year}</td><td>${car.license_plate?.split('\r')[0]}</td></tr>`).join('')}</tbody>
            </table>
            <div class="signature">X __________________________________________</div>
            <script>setTimeout(function() { window.print(); }, 750);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintReceipt = (client) => {
    const defaultMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const selectedMonth = window.prompt("Enter the Effective Month/Year for this receipt:", defaultMonth);
    if (selectedMonth === null) return; 
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
            <title>Payment Receipt - ${client.lastName}</title>
            <style>
                body { font-family: Arial; padding: 50px; text-align: center; }
                .receipt-box { border: 1px solid black; padding: 40px; margin: 20px auto; width: 450px; text-align: left; }
                .header { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
                .logo-img { height: 40px; width: 40px; object-fit: contain; margin-right: 10px; border-radius: 4px; }
                .title { font-size: 22px; font-weight: bold; border-bottom: 1px solid black; display: inline-block; margin-bottom: 30px; padding-bottom: 5px;}
                .row { margin: 15px 0; font-size: 16px; display: flex; justify-content: space-between; }
                .value { text-decoration: underline; }
                .footer { margin-top: 100px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${window.location.origin}/HHLogo.png" class="logo-img" alt="Horizon Logo" />
                <div style="font-size: 20px; font-weight: bold;">20/20 Partners</div>
            </div>
            <div class="title">Parking Payment Receipt</div>
            <div class="receipt-box">
                <div class="row"><span>Client Name:</span> <span class="value">${client.lastName}, ${client.firstName}</span></div>
                <div class="row"><span>Permit #:</span> <span class="value">${client.permitNumber || ''}</span></div>
                <div class="row"><span>Paid:</span> <span class="value">$${client.feeCharged || '0'}.00</span></div>
                <div class="row"><span>Effective Month:</span> <span class="value">${selectedMonth}</span></div>
            </div>
            <div class="footer">Printed on: ${new Date().toLocaleString()}</div>
            <script>setTimeout(function() { window.print(); }, 750);</script>
        </body>
      </html>
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
            .logo-img { height: 35px; width: 35px; object-fit: contain; margin-bottom: 8px; display: block; border-radius: 4px; }
            .flex-container { display: flex; gap: 15px; align-items: flex-start; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 4px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="title-box">Payment History</div>
          <div class="header-info">
            <div>
                <img src="${window.location.origin}/HHLogo.png" class="logo-img" alt="Horizon Logo" />
                <strong>${client.lastName}, ${client.firstName}</strong><br/>
                Client Type: ${client.type || 'Payer'}
            </div>
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
          <script>setTimeout(function() { window.print(); }, 750);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleMassPayment = async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    Swal.fire({
      title: "Process mass payments?",
      text: `Process mass payments for ${currentMonth}? This will only charge active users with a fee greater than $0 who haven't paid yet.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, process payments",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const activeClients = clients.filter(c => {
            const fee = parseFloat(c.feeCharged);
            return normalize(c.status) === 'active' && !isNaN(fee) && fee > 0;
          });

          if (activeClients.length === 0) {
            Swal.fire({ icon: "error", title: "Oops...", text: "No active clients with a valid fee greater than $0 were found." });
            return;
          }

          const res = await fetch(`${API_BASE_URL}/process-mass-payment`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ month: currentMonth, clients: activeClients, addedBy: user?.id || 1 }),
          });
          const data = await res.json();
          if (res.ok) { 
            Swal.fire({ title: "Process Complete!", html: `Payments Created: <b>${data.processed}</b><br/>Already Paid / Skipped: <b>${data.skipped}</b>`, icon: "success" });
            loadPayments(); 
          } else {
            Swal.fire({ icon: "error", title: "Server Error", text: data.error });
          }
        } catch (err) { 
          console.error(err); 
          Swal.fire({ icon: "error", title: "Oops...", text: "Something went wrong! Please try again in a few minutes." });
        }
      }
    });
  };

  const handleOpenAddFlow = () => {
    Swal.fire({
      title: 'Add New Client',
      text: 'Would you like to add just a client, or a client and their vehicle at the same time?',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonColor: '#1976d2',
      denyButtonColor: '#2e7d32',
      confirmButtonText: 'Client & Vehicle',
      denyButtonText: 'Just Client',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        startFlow('client-and-car');
      } else if (result.isDenied) {
        startFlow('client-only');
      }
    });
  };

  const startFlow = (mode) => {
    setIsEditMode(false);
    setFlowMode(mode);
    setFlowStep(1);
    setFormData({ firstName: '', lastName: '', type: 'tenant', status: 'active', permitNumber: '', feeCharged: '0', id: null });
    setCarFormData({ license_plate: '', make: '', model: '', year: '', color: '', existing_car_id: '' });
    setCarFlowType('new');
    setModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setIsEditMode(true);
    setFlowMode('client-only');
    setFlowStep(1);
    setFormData({ ...client });
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return; 
    }
    handleCloseModal();
  };

  const handleFormSubmit = async () => {
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.type || !formData.status) {
      ModalSwal.fire({ icon: "error", title: "Missing Fields", text: "Please fill out all required fields. First Name, Last Name, Type, and Status cannot be empty." });
      return; 
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
        const responseData = await res.json();
        await loadClients();
        
        if (!isEditMode && flowMode === 'client-and-car') {
            setNewlyCreatedClientId(responseData.id);
            setFlowStep(2);
            ModalSwal.fire({ title: "Client Created!", text: "Now let's associate a vehicle.", icon: "success", timer: 1500, showConfirmButton: false });
        } else {
            handleCloseModal();
            Swal.fire({ title: "Success!", text: "Data has been updated!", icon: "success" });
        }
      } else {
        const err = await res.json();
        ModalSwal.fire({ icon: "error", title: "Error", text: err.error });
      }
    } catch (err) { 
      console.error(err); 
      ModalSwal.fire({ icon: "error", title: "Oops...", text: "Something went wrong! Please try again in a few minutes." });
    }
  };

  const handleCarSubmit = async () => {
    if (carFlowType === 'new') {
        if (!carFormData.license_plate?.trim() || !carFormData.make?.trim() || !carFormData.model?.trim() || !carFormData.year?.toString().trim() || !carFormData.color?.trim()) {
            ModalSwal.fire({ icon: "error", title: "Missing Fields", text: "Please fill out all new vehicle details." });
            return; 
        }

        const payload = {
            ...carFormData,
            owner_id: newlyCreatedClientId,
            addedBy: (user?.username || 'ADM').substring(0, 3).toUpperCase()
        };

        try {
            const res = await fetch(`${API_BASE_URL}/cars`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await loadAllCars();
                handleCloseModal();
                Swal.fire({ title: "Success!", text: "Client and New Vehicle created!", icon: "success" });
            } else {
                const errData = await res.json();
                ModalSwal.fire({ icon: "error", title: "Server Error", text: errData.error });
            }
        } catch(err) { console.error(err); }

    } else {
        if (!carFormData.existing_car_id) {
            ModalSwal.fire({ icon: "error", title: "Missing Fields", text: "Please select an existing vehicle from the list." });
            return;
        }

        const existingCar = allCars.find(c => c.id == carFormData.existing_car_id);
        if(!existingCar) return;

        const payload = { ...existingCar, owner_id: newlyCreatedClientId };

        try {
            const res = await fetch(`${API_BASE_URL}/cars/${existingCar.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await loadAllCars();
                handleCloseModal();
                Swal.fire({ title: "Success!", text: "Vehicle successfully linked to new client!", icon: "success" });
            } else {
                const errData = await res.json();
                ModalSwal.fire({ icon: "error", title: "Server Error", text: errData.error });
            }
        } catch(err) { console.error(err); }
    }
  };

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", size: 80 },
    { 
      id: "fullName",
      header: "Full Name",
      accessorFn: (row) => `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    },
    { 
      accessorKey: "type", 
      header: "Type", 
      // FIX: Maps database values to custom UI strings in the table column
      Cell: ({ cell }) => {
        const rawValue = cell.getValue()?.toLowerCase().trim();
        const displayValue = clientTypeDisplayMap[rawValue] || cell.getValue()?.toUpperCase();
        return <Chip label={displayValue} variant="outlined" size="small" />
      }
    },
    { accessorKey: "status", header: "Status", Cell: ({ cell }) => (<Chip label={cell.getValue()?.toUpperCase()} color={normalize(cell.getValue()) === 'active' ? 'success' : 'default'} size="small" />) },
    { accessorKey: "permitNumber", header: "Permit #" },
    { accessorKey: "feeCharged", header: "Cost", Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>${cell.getValue() || "0"}</Typography> },
  ], []);

  const displayedClients = useMemo(() => {
      if (globalFilter) return clients; 
      return clients.filter(c => normalize(c.status) === normalize(statusFilter));
  }, [clients, statusFilter, globalFilter]);

  return (
    <Box sx={{ p: 3, position: 'relative', minHeight: '400px' }}>
      <Backdrop
        sx={{ 
            position: 'absolute', 
            zIndex: 1300, 
            backgroundColor: 'rgba(255, 255, 255, 0.7)' 
        }}
        open={isLoading}
      >
        <BeatLoader color="#38D6B7" size={15} />
      </Backdrop>

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
        state={{ globalFilter }}
        onGlobalFilterChange={setGlobalFilter}
        enableRowActions={user?.role === 'admin'} 
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '10px' }}>
            {user?.role === 'admin' && (
              <>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddFlow}>Add New Client</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('active')} variant="outlined" size="small" color="success">Export Active</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('inactive')} variant="outlined" size="small" color="error">Export Inactive</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={handleExportAll} variant="outlined" size="small">Export All</Button>
              </>
            )}
          </Box>
        )}
        renderRowActions={({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Parking Permit"><IconButton onClick={() => handlePrintPermit(row.original)} color="error"><ParkingIcon /></IconButton></Tooltip>
            <Tooltip title="Monthly Receipt"><IconButton onClick={() => handlePrintReceipt(row.original)} color="primary"><PdfIcon /></IconButton></Tooltip>
            <Tooltip title="Payment History"><IconButton onClick={() => handlePrintHistory(row.original)} color="info"><HistoryIcon /></IconButton></Tooltip>
            
            {user?.role === 'admin' && (
              <>
                <Tooltip title="Edit"><IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteClient(row.original.id, `${row.original.firstName} ${row.original.lastName}`)}><DeleteIcon /></IconButton></Tooltip>
              </>
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

      <Dialog open={modalOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontWeight:'bold', borderBottom: '1px solid #eee', mb: 2}}>
            {flowStep === 2 ? "Step 2: Associate Vehicle" : (isEditMode ? "Edit Client" : "Step 1: Add New Client")}
        </DialogTitle>
        <DialogContent>
            
            {/* --- STEP 1: CLIENT FORM --- */}
            {flowStep === 1 && (
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
                        <TextField 
                          select 
                          fullWidth 
                          required 
                          label="Type" 
                          value={formData.type} 
                          onChange={(e) => {
                            const newType = e.target.value;
                            let generatedPermit = formData.permitNumber;

                            if (!isEditMode) {
                                if (newType === 'payer') {
                                    generatedPermit = `10001-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                                } else if (formData.type === 'payer') {
                                    generatedPermit = ''; 
                                }
                            }

                            setFormData({...formData, type: newType, permitNumber: generatedPermit});
                          }}
                        >
                            {/* FIX: Maps database values to custom UI strings in the dropdown menu */}
                            <MenuItem value="tenant">Bank of America</MenuItem>
                            <MenuItem value="employee">Horizon</MenuItem>
                            <MenuItem value="payer">Payer</MenuItem>
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
            )}

            {/* --- STEP 2: CAR FORM --- */}
            {flowStep === 2 && (
                <Box sx={{ mt: 2 }}>
                    <ToggleButtonGroup 
                        color="primary" 
                        value={carFlowType} 
                        exclusive 
                        onChange={(e, v) => v && setCarFlowType(v)} 
                        fullWidth 
                        sx={{ mb: 3 }}
                    >
                        <ToggleButton value="new">Create New Vehicle</ToggleButton>
                        <ToggleButton value="existing">Link Existing Vehicle</ToggleButton>
                    </ToggleButtonGroup>

                    {carFlowType === 'new' ? (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField fullWidth required label="License Plate" value={carFormData.license_plate} error={carFormData.license_plate === ""} onChange={(e) => setCarFormData({...carFormData, license_plate: e.target.value})} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth required label="Make" value={carFormData.make} error={carFormData.make === ""} onChange={(e) => setCarFormData({...carFormData, make: e.target.value})} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth required label="Model" value={carFormData.model} error={carFormData.model === ""} onChange={(e) => setCarFormData({...carFormData, model: e.target.value})} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth required label="Year" value={carFormData.year} error={carFormData.year === ""} onChange={(e) => setCarFormData({...carFormData, year: e.target.value})} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField fullWidth required label="Color" value={carFormData.color} error={carFormData.color === ""} onChange={(e) => setCarFormData({...carFormData, color: e.target.value})} />
                            </Grid>
                        </Grid>
                    ) : (
                        <Autocomplete
                            options={allCars}
                            getOptionLabel={(option) => `${option.license_plate?.split('\r')[0] || 'Unknown'} - ${option.make || ''} ${option.model || ''} ${option.owner_id ? `(Owned by ID: ${option.owner_id})` : '(Unassigned)'}`}
                            value={allCars.find(c => c.id === carFormData.existing_car_id) || null}
                            onChange={(event, newValue) => {
                                setCarFormData({...carFormData, existing_car_id: newValue ? newValue.id : ''});
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Search for an Existing Vehicle"
                                    required
                                    error={carFormData.existing_car_id === ""}
                                />
                            )}
                        />
                    )}
                </Box>
            )}

        </DialogContent>
        <DialogActions sx={{p: 3}}>
            {flowStep === 1 ? (
                <>
                    <Button onClick={handleCloseModal}>Cancel</Button>
                    <Button variant="contained" onClick={handleFormSubmit}>
                        {isEditMode ? "Save Changes" : (flowMode === 'client-and-car' ? "Next: Add Vehicle" : "Create Client")}
                    </Button>
                </>
            ) : (
                <>
                    <Button onClick={handleCloseModal}>Skip / Do Later</Button>
                    <Button variant="contained" onClick={handleCarSubmit}>Save Vehicle</Button>
                </>
            )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}