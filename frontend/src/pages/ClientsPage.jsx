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
  
  // MODAL STATES
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

  // --- MODAL HANDLERS ---
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
    const url = isEditMode ? `${API_BASE_URL}/clients/${formData.id}` : `${API_BASE_URL}/clients`;
    const method = isEditMode ? "PUT" : "POST";
    
    // Add logic for Add Client specific fields
    const payload = isEditMode ? formData : {
        ...formData,
        address: "", city: "", state: "", zip: "", phone: "", email: "", company: "",
        ccNum: "", ccExp: "",
        addedBy: (user?.username || 'ADM').substring(0, 3).toUpperCase()
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
    { 
        accessorKey: "type", 
        header: "Type", 
        Cell: ({ cell }) => <Chip label={cell.getValue()?.toUpperCase()} variant="outlined" size="small" />
    },
    { 
      accessorKey: "status", 
      header: "Status", 
      Cell: ({ cell }) => (
        <Chip label={cell.getValue()?.toUpperCase()} color={normalize(cell.getValue()) === 'active' ? 'success' : 'default'} size="small" />
      )
    },
    { accessorKey: "permitNumber", header: "Permit #" },
    { accessorKey: "feeCharged", header: "Cost", Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>${cell.getValue() || "0"}</Typography> },
  ], []);

  const displayedClients = useMemo(() => clients.filter(c => normalize(c.status) === normalize(statusFilter)), [clients, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Client Directory</Typography>
        <Stack direction="row" spacing={2}>
            <ToggleButtonGroup color="primary" value={statusFilter} exclusive onChange={(e, v) => v && setStatusFilter(v)} size="small">
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="inactive">Inactive</ToggleButton>
            </ToggleButtonGroup>
        </Stack>
      </Stack>

      <MaterialReactTable
        columns={columns}
        data={displayedClients}
        enableEditing={false} // We handle custom editing
        renderTopToolbarCustomActions={() => (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add New Client</Button>
        )}
        renderRowActions={({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton>
          </Stack>
        )}
        displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Actions' } }}
        enableRowActions
      />

      {/* --- SEPARATE CUSTOM MODAL --- */}
      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontWeight:'bold', borderBottom: '1px solid #eee', mb: 2}}>
            {isEditMode ? "Edit Client" : "Add New Client"}
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={6}>
                    <TextField fullWidth label="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField select fullWidth label="Type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                        <MenuItem value="tenant">Tenant</MenuItem>
                        <MenuItem value="employee">Employee</MenuItem>
                        <MenuItem value="payer">Payer</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6}>
                    <TextField select fullWidth label="Status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
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