"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import { Box, Tooltip, IconButton, Typography, Chip, Link, Button } from "@mui/material";
import { 
  Delete as DeleteIcon, 
  Person as PersonIcon, 
  Add as AddIcon, 
  Edit as EditIcon 
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function CarsPage({ user, onNavigateClient, initialFilter }) {
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]); 
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => { 
    loadCars(); 
    loadClients(); 
  }, []);

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

  const handleCreateCar = async ({ values, table }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, addedBy: user?.username }),
      });
      if (res.ok) {
        loadCars();
        table.setCreatingRow(null);
      }
    } catch (err) { console.error("Error creating car:", err); }
  };

  const handleSaveCar = async ({ values, table }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars/${values.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        loadCars();
        table.setEditingRow(null);
      }
    } catch (err) { console.error("Error updating car:", err); }
  };

  const handleDeleteCar = async (id, plate) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${plate}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
        if (res.ok) loadCars();
      } catch (err) { console.error("Error deleting car:", err); }
    }
  };

  const columns = useMemo(() => [
    { accessorKey: "id", header: "ID", enableEditing: false, size: 80 },
    { 
      accessorKey: "license_plate", 
      header: "Plate", 
      muiEditTextFieldProps: { required: true },
      Cell: ({ cell }) => (
        <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {cell.getValue()?.split('\r')[0]}
        </Typography>
      )
    },
    { accessorKey: "make", header: "Make", muiEditTextFieldProps: { required: true } },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "year", header: "Year" },
    { accessorKey: "color", header: "Color" },
    {
      accessorKey: "owner_id",
      header: "Owner",
      editVariant: 'select',
      editSelectOptions: clients.map(c => ({
        label: `${c.lastName}, ${c.firstName} (ID: ${c.id})`,
        value: c.id,
      })),
      // FIX: Ensure the current owner is selected when editing
      muiEditTextFieldProps: ({ row }) => ({
        select: true,
        value: row?.original?.owner_id || "", 
      }),
      accessorFn: (row) => `${row.owner_first || ''} ${row.owner_last || ''}`,
      id: "owner_name",
      Cell: ({ row, renderedCellValue }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Link
            component="button"
            variant="body2"
            sx={{ fontWeight: 600, textAlign: 'left', textDecoration: 'none' }}
            onClick={() => onNavigateClient(row.original.owner_last || "")}
          >
            {renderedCellValue && renderedCellValue.trim() !== "" ? renderedCellValue : `ID: ${row.original.owner_id}`}
          </Link>
        </Box>
      ),
    },
  ], [onNavigateClient, clients]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2c3e50' }}>
        Vehicle Inventory
      </Typography>
      
      <MaterialReactTable 
        columns={columns} 
        data={cars} 
        editDisplayMode="modal"
        enableEditing
        onEditingRowSave={handleSaveCar}
        onCreatingRowSave={handleCreateCar}
        state={{ globalFilter }} 
        onGlobalFilterChange={setGlobalFilter}
        renderTopToolbarCustomActions={({ table }) => (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => table.setCreatingRow(true)}>
            Add New Vehicle
          </Button>
        )}
        renderRowActions={({ row, table }) => (
          <Box sx={{ display: 'flex', gap: '0.5rem' }}>
            <Tooltip title="Edit">
              <IconButton onClick={() => table.setEditingRow(row)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            {user?.role === "admin" && (
              <Tooltip title="Delete">
                <IconButton color="error" onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
        enableStickyHeader
        initialState={{ density: 'compact' }}
        muiTablePaperProps={{ elevation: 2, sx: { borderRadius: '12px' } }}
      />
    </Box>
  );
}