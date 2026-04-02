"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import { 
  Box, Tooltip, IconButton, Typography, Link, Button, 
  Stack, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Grid 
} from "@mui/material";
import { 
  Delete as DeleteIcon, Person as PersonIcon, Add as AddIcon, 
  Edit as EditIcon, FileDownload as FileDownloadIcon
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';
import { mkConfig, generateCsv, download } from 'export-to-csv';

const csvConfigBase = { fieldSeparator: ',', decimalSeparator: '.', useKeysAsHeaders: true };

export default function CarsPage({ user, onNavigateClient, initialFilter }) {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]); 
  const [statusFilter, setStatusFilter] = useState("active");
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  // MODAL STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', license_plate: '', make: '', model: '', year: '', color: '', owner_id: '' 
  });

  useEffect(() => { loadCars(); loadClients(); }, []);
  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter]);

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to load cars:", err); }
  };

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to load clients:", err); }
  };

  // --- MODAL HANDLERS ---
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setFormData({ id: '', license_plate: '', make: '', model: '', year: '', color: '', owner_id: '' });
    setModalOpen(true);
  };

  const handleOpenEditModal = (carRow) => {
    if (!carRow.id) {
       loadCars();
       alert("Synchronizing with database, please click edit again.");
       return;
    }

    setIsEditMode(true);
    setFormData({
      id: carRow.id || '', 
      license_plate: carRow.license_plate || '',
      make: carRow.make || '',
      model: carRow.model || '',
      year: carRow.year || '',
      color: carRow.color || '',
      owner_id: carRow.owner_id || ''
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleFormSubmit = async () => {
    if (isEditMode && (!formData.id || formData.id === '')) {
        alert("Error: Vehicle ID is missing. The system cannot update an unknown record.");
        return;
    }

    const url = isEditMode ? `${API_BASE_URL}/cars/${formData.id}` : `${API_BASE_URL}/cars`;
    const method = isEditMode ? "PUT" : "POST";
    
    const payload = {
        license_plate: formData.license_plate,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        owner_id: formData.owner_id === '' ? null : formData.owner_id,
        addedBy: (user?.username || 'ADM').substring(0, 3).toUpperCase()
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadCars();
        handleCloseModal();
      } else {
        const errData = await res.json();
        alert(`Server Error: ${errData.error || 'Failed to save vehicle'}`);
      }
    } catch (err) { console.error("Form Submit Error:", err); }
  };

  const handleDeleteCar = async (id, plate) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${plate}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
        if (res.ok) loadCars();
      } catch (err) { console.error("Error deleting car:", err); }
    }
  };

  const handleExportByStatus = (status) => {
    const filteredData = cars.filter(car => {
      const owner = clients.find(c => c.id == car.owner_id);
      return (owner?.status?.toLowerCase() || "inactive") === status.toLowerCase();
    });
    const config = mkConfig({ ...csvConfigBase, filename: `${status}-vehicles-export` });
    const csv = generateCsv(config)(filteredData);
    download(config)(csv);
  };

  const displayedCars = useMemo(() => {
    return cars.filter(car => {
      const owner = clients.find(c => c.id == car.owner_id);
      return (owner?.status?.toLowerCase() || "inactive") === statusFilter.toLowerCase();
    });
  }, [cars, clients, statusFilter]);

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", size: 80 },
    { 
      accessorKey: "license_plate", header: "Plate",
      Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{cell.getValue()?.toString().split('\r')[0]}</Typography>
    },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "year", header: "Year" },
    { accessorKey: "color", header: "Color" },
    {
      accessorKey: "owner_id",
      header: "Owner",
      accessorFn: (row) => `${row.owner_first || ''} ${row.owner_last || ''}`.trim(),
      id: "owner_name",
      Cell: ({ row, renderedCellValue }) => {
        const nameStr = renderedCellValue?.toString() || "";
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Link 
              component="button" 
              variant="body2" 
              sx={{ fontWeight: 600, textAlign: 'left', textDecoration: 'none' }} 
              onClick={() => onNavigateClient(row.original.owner_last || "")}
            >
              {nameStr !== "" ? nameStr : `ID: ${row.original.owner_id}`}
            </Link>
          </Box>
        );
      },
    },
  ], [onNavigateClient]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Vehicle Inventory</Typography>
        <ToggleButtonGroup color="primary" value={statusFilter} exclusive onChange={(e, v) => v && setStatusFilter(v)} size="small">
          <ToggleButton value="active">Active Owners</ToggleButton>
          <ToggleButton value="inactive">Inactive Owners</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <MaterialReactTable 
        columns={columns} 
        data={displayedCars} 
        state={{ globalFilter }} 
        onGlobalFilterChange={setGlobalFilter}
        enableRowActions
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add New Vehicle</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('active')} variant="outlined" size="small" color="success">Export Active</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('inactive')} variant="outlined" size="small" color="error">Export Inactive</Button>
            <Button startIcon={<FileDownloadIcon />} onClick={() => download(mkConfig({ ...csvConfigBase, filename: 'all-vehicles' }))(generateCsv(mkConfig({ ...csvConfigBase }))(cars))} variant="outlined" size="small">Export All</Button>
          </Box>
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title="Edit"><IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton></Tooltip>
            {user?.role === "admin" && <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}><DeleteIcon /></IconButton></Tooltip>}
          </Box>
        )}
      />

      <Dialog open={modalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontWeight:'bold', borderBottom: '1px solid #eee', mb: 2}}>
            {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={12}>
                    <TextField fullWidth label="License Plate" value={formData.license_plate} onChange={(e) => setFormData({...formData, license_plate: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Make" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Model" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth label="Color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} />
                </Grid>
                <Grid item xs={12}>
                    <TextField select fullWidth label="Owner" value={formData.owner_id || ''} onChange={(e) => setFormData({...formData, owner_id: e.target.value})}>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {clients.map((c) => (
                            <MenuItem key={c.id} value={c.id}>
                                {c.lastName}, {c.firstName} (ID: {c.id})
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{p: 3}}>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button variant="contained" onClick={handleFormSubmit}>{isEditMode ? "Save Changes" : "Create Vehicle"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}