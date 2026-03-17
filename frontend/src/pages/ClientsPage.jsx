"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Grid,
  Button,
  Paper
} from "@mui/material";
import { 
  DirectionsCar as CarIcon, 
  Badge as PermitIcon,
  Add as AddIcon,
  Edit as EditIcon 
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ClientsPage({ user }) {
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => {
    loadClients();
    loadAllCars();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      const cleanData = Array.isArray(data) ? data.filter(row => row.id) : [];
      setClients(cleanData);
    } catch (err) { console.error("Failed to load clients:", err); }
  };

  const loadAllCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setAllCars(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to load cars:", err); }
  };

  const handleCreateClient = async ({ values, table }) => {
    try {
      // If user left permit empty, generate one. If they typed some, use theirs.
      const permitVal = values.permitNumber || `P-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = { ...values, permitNumber: permitVal, addedBy: user?.username || 'Sys' };

      const res = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        loadClients();
        table.setCreatingRow(null); 
      }
    } catch (err) { console.error("Error creating client:", err); }
  };

  const handleSaveClient = async ({ values, table }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients/${values.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        loadClients();
        table.setEditingRow(null); 
      }
    } catch (err) { console.error("Error updating client:", err); }
  };

  const displayedClients = useMemo(() => {
    return clients.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [clients, statusFilter]);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID", enableEditing: false, size: 80 },
      { accessorKey: "firstName", header: "First Name", muiEditTextFieldProps: { required: true } },
      { accessorKey: "lastName", header: "Last Name", muiEditTextFieldProps: { required: true } },
      { accessorKey: "email", header: "Email Address" },
      { accessorKey: "phone", header: "Phone (Cell)" },
      { 
        accessorKey: "permitNumber", 
        header: "Permits", 
        muiEditTextFieldProps: { 
          helperText: "Enter multiple permits separated by commas (e.g. 101, 102)" 
        },
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return 'N/A';
          const list = val.toString().split(',').map(p => p.trim());
          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {list.map((p, i) => <Chip key={i} label={p} size="small" variant="outlined" />)}
            </Box>
          );
        }
      },
      { accessorKey: "company", header: "Company" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "city", header: "City" },
      { accessorKey: "state", header: "ST" },
      { accessorKey: "zip", header: "Zip" },
      { accessorKey: "ccNum", header: "Credit Card #" },
      { accessorKey: "ccExp", header: "CC Exp" },
      {
        accessorKey: "status",
        header: "Status",
        editVariant: 'select',
        editSelectOptions: ['active', 'inactive'],
        Cell: ({ cell }) => (
          <Chip label={cell.getValue() || 'active'} size="small" color={cell.getValue() === 'active' ? 'success' : 'error'} />
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Client Directory</Typography>
        <ToggleButtonGroup color="primary" value={statusFilter} exclusive onChange={(e, val) => val && setStatusFilter(val)} size="small">
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <MaterialReactTable
        columns={columns}
        data={displayedClients}
        editDisplayMode="modal"
        enableEditing={true}
        getRowId={(row) => row.id}
        onEditingRowSave={handleSaveClient}
        onCreatingRowSave={handleCreateClient}
        renderTopToolbarCustomActions={({ table }) => (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => table.setCreatingRow(true)}>
            Add New Client
          </Button>
        )}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="small" startIcon={<EditIcon />} onClick={() => table.setEditingRow(row)}>Edit</Button>
          </Box>
        )}
        renderDetailPanel={({ row }) => {
          const clientVehicles = allCars.filter(car => car.owner_id == row.original.id);
          const permitString = row.original.permitNumber || "";
          const permitList = permitString.split(',').map(p => p.trim()).filter(p => p !== "");

          return (
            <Box sx={{ p: 2, backgroundColor: '#fcfcfc' }}>
              <Grid container spacing={4}>
                {/* VEHICLES SECTION */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                    <CarIcon fontSize="small" color="primary" /> Registered Vehicles
                  </Typography>
                  {clientVehicles.length > 0 ? (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                      {clientVehicles.map((car, idx) => (
                        <ListItem key={car.id} divider={idx < clientVehicles.length - 1}>
                          <ListItemText primary={`${car.make} ${car.model}`} secondary={`Plate: ${car.license_plate?.split('\r')[0]} | Color: ${car.color}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : ( <Typography variant="body2" color="text.secondary">No vehicles found.</Typography> )}
                </Grid>

                {/* PERMITS SECTION - NOW A SEPARATE LIST */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                    <PermitIcon fontSize="small" color="secondary" /> Permanent Permits
                  </Typography>
                  {permitList.length > 0 ? (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                      {permitList.map((permit, idx) => (
                        <ListItem key={idx} divider={idx < permitList.length - 1}>
                          <ListItemText 
                            primary={`Permit #${permit}`} 
                            secondary="Permanent Association"
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No permanent permits assigned.</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          );
        }}
        initialState={{ 
          density: 'compact',
          sorting: [{ id: 'fullName', desc: false }],
          columnVisibility: { address: false, city: false, state: false, zip: false, ccNum: false, ccExp: false } 
        }}
      />
    </Box>
  );
}