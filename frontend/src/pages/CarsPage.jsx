"use client"

import { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import "./CarsPage.css"
import {
  Box,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import MaterialReactTable from "material-react-table";

export default function CarsPage({ user, onNavigateClient }) {
  const [cars, setCars] = useState([])

  useEffect(() => {
    loadCars()
  }, [])

  const loadCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`)
      const data = await res.json()
      setCars(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load cars:", err)
    }
  }

  const handleDeleteCar = async (id, plate) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${plate}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, { method: 'DELETE' });
        if (res.ok) loadCars();
      } catch (err) {
        console.error("Error deleting car:", err);
      }
    }
  }

  // Define Columns for MaterialReactTable
  const columns = useMemo(
    () => [
      {
        accessorKey: "license_plate",
        header: "License Plate",
        Cell: ({ cell, row }) => (
          <Box>
            <strong>{cell.getValue()?.split('\r')[0]}</strong>
            {row.original.has_active_permit === 1 && (
              <Box sx={{ fontSize: '10px', color: '#155724', mt: 0.5 }}>Active</Box>
            )}
          </Box>
        ),
      },
      { accessorKey: "make", header: "Make" },
      { accessorKey: "model", header: "Model" },
      { accessorKey: "year", header: "Year" },
      { accessorKey: "color", header: "Color" },
      {
        accessorKey: "owner_id",
        header: "Owner ID",
        Cell: ({ cell }) => (
          <Box sx={{ fontWeight: '600', color: '#667eea' }}>
            {cell.getValue() || "Unknown"}
          </Box>
        ),
      },
      {
        accessorKey: "actions",
        header: "Actions",
        enableColumnOrdering: false,
        enableSorting: false,
        Cell: ({ row }) => (
          user.role === "admin" && (
            <Tooltip title="Delete">
              <IconButton 
                color="error" 
                onClick={() => handleDeleteCar(row.original.id, row.original.license_plate)}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )
        ),
      },
    ],
    [user.role]
  );

  return (
    <div className="cars-page">
      <div className="page-header">
        <h2>All Vehicles</h2>
      </div>

      <Box sx={{ mt: 2 }}>
        <MaterialReactTable
          columns={columns}
          data={cars}
          enableColumnOrdering
          enablePinning
          enableStickyHeader
          initialState={{ 
            density: 'compact',
            columnPinning: { right: ["actions"] } 
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: { borderRadius: '8px', border: '1px solid #e0e0e0' }
          }}
          muiTableHeadCellProps={{
            sx: { backgroundColor: '#f5f5f5', fontWeight: 'bold' }
          }}
        />
      </Box>
    </div>
  )
}