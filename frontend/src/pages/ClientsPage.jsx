"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Typography,
  Chip,
  Link, // Added for the clickable permit
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { DirectionsCar as CarIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ClientsPage({ user, onNavigatePermit }) { // Added navigation prop
  const [clients, setClients] = useState([]);
  const [allCars, setAllCars] = useState([]);

  useEffect(() => {
    loadClients();
    loadAllCars();
  }, []);

  const loadClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  const loadAllCars = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cars`);
      const data = await res.json();
      setAllCars(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load cars:", err);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 80,
      },
      {
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        id: "fullName",
        header: "Name",
        Cell: ({ renderedCellValue, row }) => (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 'bold' }}>{renderedCellValue}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.original.company || "No Company"}
            </Typography>
          </Box>
        ),
      },
      {
        // NEW: Permit Number Column
        accessorKey: "permitNumber", // Maps to 'Permit #' from your SQL
        header: "Permit #",
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return <Typography variant="body2" color="text.disabled">None</Typography>;
          
          return (
            <Link
              component="button"
              variant="body2"
              underline="hover"
              onClick={() => onNavigatePermit(val)} // Assuming your App.jsx handles routing
              sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'left' }}
            >
              {val}
            </Link>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "type",
        header: "Type",
        Cell: ({ cell }) => (
          <Chip 
            label={cell.getValue() || 'Standard'} 
            size="small" 
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => {
          const status = cell.getValue()?.toLowerCase();
          return (
            <Chip 
              label={cell.getValue() || 'Unknown'} 
              size="small" 
              color={status === 'active' ? 'success' : 'error'}
            />
          );
        },
      },
    ],
    [onNavigatePermit]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Client Directory
      </Typography>

      <MaterialReactTable
        columns={columns}
        data={clients}
        enableColumnOrdering
        renderDetailPanel={({ row }) => {
          const clientVehicles = allCars.filter(car => car.owner_id == row.original.id);
          return (
            <Box sx={{ p: 2, backgroundColor: '#fcfcfc' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CarIcon fontSize="small" /> Registered Vehicles
              </Typography>
              {clientVehicles.length > 0 ? (
                <List sx={{ width: '100%', maxWidth: 400, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                  {clientVehicles.map((car, idx) => (
                    <React.Fragment key={car.id}>
                      <ListItem>
                        <ListItemText 
                          primary={`${car.make} ${car.model}`} 
                          secondary={`Plate: ${car.license_plate?.split('\r')[0]} | Color: ${car.color}`} 
                        />
                      </ListItem>
                      {idx < clientVehicles.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  No vehicles found.
                </Typography>
              )}
            </Box>
          );
        }}
        initialState={{ 
          density: 'compact',
          sorting: [{ id: 'fullName', desc: false }] 
        }}
        muiTablePaperProps={{
          elevation: 2,
          sx: { borderRadius: '12px' }
        }}
      />
    </Box>
  );
}