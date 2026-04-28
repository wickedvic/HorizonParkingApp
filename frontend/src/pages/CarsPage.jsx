"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import Swal from 'sweetalert2'; 
import { BeatLoader } from "react-spinners" 
import { 
  Box, Tooltip, IconButton, Typography, Link, Button, 
  Stack, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, MenuItem, Grid, Chip,
  Backdrop // FIX: Imported Backdrop
} from "@mui/material";
import { 
  Delete as DeleteIcon, Person as PersonIcon, Add as AddIcon, 
  Edit as EditIcon, FileDownload as FileDownloadIcon
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

export default function CarsPage({ user, onNavigateClient, initialFilter }) {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]); 
  const [statusFilter, setStatusFilter] = useState("active");
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");
  const [isLoading, setIsLoading] = useState(true); 

  // MODAL STATES
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', license_plate: '', make: '', model: '', year: '', color: '', owner_id: '' 
  });

  useEffect(() => { 
    setIsLoading(true);
    // FIX: Included 1-second delay
    Promise.all([
        loadCars(), 
        loadClients(),
        new Promise(resolve => setTimeout(resolve, 1000))
    ]).finally(() => {
        setIsLoading(false);
    });
  }, []);

  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter]);

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Failed to load cars:", err); 
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again in a few minutes.",
      });
    }
  };

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Failed to load clients:", err); 
    }
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
       ModalSwal.fire({
         icon: "info",
         title: "Syncing...",
         text: "Synchronizing with database, please click edit again."
       });
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

  const handleDialogClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return; 
    }
    handleCloseModal();
  };

  const handleFormSubmit = async () => {
    if (isEditMode && (!formData.id || formData.id === '')) {
        ModalSwal.fire({
          icon: "error",
          title: "Oops...",
          text: "Error: Vehicle ID is missing. The system cannot update an unknown record.",
        });
        return;
    }

    if (
        !formData.license_plate?.trim() || 
        !formData.make?.trim() || 
        !formData.model?.trim() || 
        !formData.year?.toString().trim() || 
        !formData.color?.trim() || 
        !formData.owner_id
    ) {
        ModalSwal.fire({
          icon: "error",
          title: "Missing Fields",
          text: "Please fill out all vehicle details. No fields can be left empty.",
        });
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
        Swal.fire({
          title: "Success!",
          text: "Data has been updated!",
          icon: "success"
        });
      } else {
        const errData = await res.json();
        ModalSwal.fire({
          icon: "error",
          title: "Server Error",
          text: errData.error || 'Failed to save vehicle',
        });
      }
    } catch (err) { 
      console.error("Form Submit Error:", err); 
      ModalSwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! Please try again in a few minutes.",
      });
    }
  };

  const handleDeleteCar = (id, plate) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete vehicle ${plate}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
          if (res.ok) {
            loadCars();
            Swal.fire("Deleted!", "Data has been updated!", "success");
          } else {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Failed to delete from server.",
            });
          }
        } catch (err) { 
          console.error("Error deleting car:", err); 
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong! Please try again in a few minutes.",
          });
        }
      } else if (result.isDismissed) {
        Swal.fire("Cancelled", "Changes are not saved", "info");
      }
    });
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
      if (globalFilter) return true; 
      const owner = clients.find(c => c.id == car.owner_id);
      return (owner?.status?.toLowerCase() || "inactive") === statusFilter.toLowerCase();
    });
  }, [cars, clients, statusFilter, globalFilter]);

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
      id: "status",
      header: "Status",
      accessorFn: (row) => {
        const owner = clients.find(c => c.id == row.owner_id);
        return owner?.status || "inactive";
      },
      Cell: ({ cell }) => {
        const status = cell.getValue()?.toString().toLowerCase().trim() || "inactive";
        return (
          <Chip 
            label={status.toUpperCase()} 
            color={status === 'active' ? 'success' : 'default'} 
            size="small" 
          />
        );
      }
    },
    {
      accessorFn: (row) => {
        const first = row.owner_first || "";
        const last = row.owner_last || "";
        const fullName = `${first} ${last}`.trim();
        return fullName || `ID: ${row.owner_id || 'Unknown'}`;
      },
      id: "owner_name",
      header: "Owner",
      Cell: ({ row, renderedCellValue }) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Link 
              component="button" 
              variant="body2" 
              sx={{ fontWeight: 600, textAlign: 'left', textDecoration: 'none' }} 
              onClick={() => {
                const first = row.original.owner_first || "";
                const last = row.original.owner_last || "";
                const fullName = `${first} ${last}`.trim();
                
                if (fullName) {
                  onNavigateClient(fullName);
                } else {
                  onNavigateClient(row.original.owner_id?.toString() || "");
                }
              }}
            >
              {renderedCellValue}
            </Link>
          </Box>
        );
      },
    },
  ], [onNavigateClient, clients]);

  return (
    // FIX: Position relative on the main container so the absolute backdrop perfectly bounds the active view
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
        enableRowActions={user?.role === 'admin'}
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {user?.role === 'admin' && (
              <>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>Add New Vehicle</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('active')} variant="outlined" size="small" color="success">Export Active</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={() => handleExportByStatus('inactive')} variant="outlined" size="small" color="error">Export Inactive</Button>
                <Button startIcon={<FileDownloadIcon />} onClick={() => download(mkConfig({ ...csvConfigBase, filename: 'all-vehicles' }))(generateCsv(mkConfig({ ...csvConfigBase }))(cars))} variant="outlined" size="small">Export All</Button>
              </>
            )}
          </Box>
        )}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title="Edit"><IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}><DeleteIcon /></IconButton></Tooltip>
          </Box>
        )}
      />

      <Dialog open={modalOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{fontWeight:'bold', borderBottom: '1px solid #eee', mb: 2}}>
            {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={12}>
                    <TextField 
                      fullWidth 
                      required
                      label="License Plate" 
                      value={formData.license_plate} 
                      error={formData.license_plate === ""}
                      onChange={(e) => setFormData({...formData, license_plate: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="Make" 
                      value={formData.make} 
                      error={formData.make === ""}
                      onChange={(e) => setFormData({...formData, make: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="Model" 
                      value={formData.model} 
                      error={formData.model === ""}
                      onChange={(e) => setFormData({...formData, model: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="Year" 
                      value={formData.year} 
                      error={formData.year === ""}
                      onChange={(e) => setFormData({...formData, year: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField 
                      fullWidth 
                      required
                      label="Color" 
                      value={formData.color} 
                      error={formData.color === ""}
                      onChange={(e) => setFormData({...formData, color: e.target.value})} 
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField 
                      select 
                      fullWidth 
                      required
                      label="Owner" 
                      value={formData.owner_id || ''} 
                      error={formData.owner_id === ""}
                      onChange={(e) => setFormData({...formData, owner_id: e.target.value})}
                    >
                        <MenuItem value="" disabled><em>Select an Owner</em></MenuItem>
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