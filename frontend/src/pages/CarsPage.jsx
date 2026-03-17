"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import { Box, Tooltip, IconButton, Typography, Chip, Link } from "@mui/material";
import { Delete as DeleteIcon, Person as PersonIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function CarsPage({ user, onNavigateClient, initialFilter }) {
  const [cars, setCars] = useState([]);
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => { loadCars(); }, []);
  useEffect(() => { setGlobalFilter(initialFilter || ""); }, [initialFilter]);

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Failed to load cars:", err); }
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
    { 
      accessorKey: "license_plate", 
      header: "Plate", 
      Cell: ({ cell }) => (
        <Typography sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
          {cell.getValue()?.split('\r')[0]}
        </Typography>
      )
    },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
    {
      id: "owner_name", // Unique ID for the column
      header: "Owner",
      // Accessor function combines first and last name for sorting/filtering
      accessorFn: (row) => `${row.owner_first || ''} ${row.owner_last || ''}`,
      Cell: ({ row, renderedCellValue }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Link
            component="button"
            variant="body2"
            sx={{ 
              fontWeight: 600, 
              textAlign: 'left',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' } 
            }}
            onClick={() => {
              // Navigate using the Last Name for the best filtering results on the Clients page
              const lastName = row.original.owner_last || "";
              onNavigateClient(lastName);
            }}
          >
            {renderedCellValue || "Unknown Owner"}
          </Link>
        </Box>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      enableSorting: false,
      size: 100,
      Cell: ({ row }) => (
        user?.role === "admin" && (
          <Tooltip title="Delete Vehicle">
            <IconButton 
              color="error" 
              size="small"
              onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      )
    },
  ], [onNavigateClient, user?.role]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#2c3e50' }}>
        Vehicle Inventory
      </Typography>
      
      <MaterialReactTable 
        columns={columns} 
        data={cars} 
        state={{ globalFilter }} 
        onGlobalFilterChange={setGlobalFilter}
        enableStickyHeader
        initialState={{ density: 'compact' }}
        muiTablePaperProps={{
          elevation: 2,
          sx: { borderRadius: '12px' }
        }}
      />
    </Box>
  );
}