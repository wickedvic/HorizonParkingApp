"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Tooltip,
  IconButton,
  Typography,
  Chip,
  Link // Added Link
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function CarsPage({ user, onNavigateClient, initialFilter }) { // Added props
  const [cars, setCars] = useState([]);
  const [globalFilter, setGlobalFilter] = useState(initialFilter || "");

  useEffect(() => {
    loadCars();
  }, []);

  // Sync internal filter if Dashboard tells us to filter by a plate
  useEffect(() => {
    setGlobalFilter(initialFilter || "");
  }, [initialFilter]);

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setCars(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load cars:", err);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "license_plate",
        header: "License Plate",
        Cell: ({ cell, row }) => (
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>
              {cell.getValue()?.split('\r')[0]}
            </Typography>
            {row.original.has_active_permit === 1 && (
              <Chip label="Active" size="small" color="success" variant="outlined" sx={{ height: '18px', fontSize: '10px', mt: 0.5 }} />
            )}
          </Box>
        ),
      },
      { accessorKey: "make", header: "Make" },
      { accessorKey: "model", header: "Model" },
      {
        accessorKey: "owner_id",
        header: "Owner ID",
        Cell: ({ cell }) => (
          <Link
            component="button"
            variant="body2"
            sx={{ fontWeight: 600, cursor: 'pointer' }}
            onClick={() => onNavigateClient(cell.getValue())} // Triggers jump to Clients
          >
            {cell.getValue() || "Unknown"}
          </Link>
        ),
      },
      // ... keep other columns same
    ],
    [onNavigateClient]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>Vehicle Inventory</Typography>
      <MaterialReactTable
        columns={columns}
        data={cars}
        state={{ globalFilter }}
        onGlobalFilterChange={setGlobalFilter}
        initialState={{ density: 'compact' }}
      />
    </Box>
  );
}