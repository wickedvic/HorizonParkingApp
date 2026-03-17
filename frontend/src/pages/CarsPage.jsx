"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import { Box, Tooltip, IconButton, Typography, Chip, Link } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
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
    } catch (err) { console.error(err); }
  };

  const handleDeleteCar = async (id, plate) => {
    if (window.confirm(`Delete ${plate}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
        if (res.ok) loadCars();
      } catch (err) { console.error(err); }
    }
  };

  const columns = useMemo(() => [
    { accessorKey: "license_plate", header: "Plate", 
      Cell: ({ cell }) => <Typography sx={{ fontWeight: 'bold' }}>{cell.getValue()?.split('\r')[0]}</Typography> 
    },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
    { accessorKey: "owner_id", header: "Owner ID", 
      Cell: ({ cell }) => <Link component="button" sx={{fontWeight:600}} onClick={() => onNavigateClient(cell.getValue())}>{cell.getValue() || "Unknown"}</Link> 
    },
    { accessorKey: "actions", header: "Actions", enableSorting: false, 
      Cell: ({ row }) => (
        user?.role === "admin" && (
          <IconButton color="error" onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}><DeleteIcon /></IconButton>
        )
      )
    },
  ], [onNavigateClient, user?.role]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Vehicle Inventory</Typography>
      <MaterialReactTable columns={columns} data={cars} state={{ globalFilter }} onGlobalFilterChange={setGlobalFilter} />
    </Box>
  );
}