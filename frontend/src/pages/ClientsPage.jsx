"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Typography,
  Chip,
  Link,
  List,
  ListItem,
  ListItemText,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Stack
} from "@mui/material";
import { DirectionsCar as CarIcon } from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ClientsPage({ user, onNavigatePermit }) {
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
      
      // MASSAGE DATA: Remove completely empty rows or rows without a name/ID
      const cleanData = Array.isArray(data) ? data.filter(row => 
        row.id && (row.firstName || row.lastName)
      ) : [];
      
      setClients(cleanData);
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

  // Filter clients based on the Toggle Button
  const displayedClients = useMemo(() => {
    return clients.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
  }, [clients, statusFilter]);

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
        accessorKey: "permitNumber",
        header: "Permits",
        Cell: ({ cell }) => {
          const val = cell.getValue();
          if (!val) return <Typography variant="caption" color="text.disabled">None</Typography>;
          
          // Split by comma in case there are multiple permits (e.g., "101, 102")
          const permitList = val.toString().split(',').map(p => p.trim());
          
          return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {permitList.map((permit, index) => (
                <Link
                  key={index}
                  component="button"
                  variant="body2"
                  onClick={() => onNavigatePermit(permit)}
                  sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  #{permit}
                  {index < permitList.length - 1 && ","}
                </Link>
              ))}
            </Box>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ cell }) => (
          <Chip 
            label={cell.getValue() || 'Unknown'} 
            size="small" 
            color={cell.getValue()?.toLowerCase() === 'active' ? 'success' : 'error'}
          />
        ),
      },
    ],
    [onNavigatePermit]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Client Directory
        </Typography>

        <ToggleButtonGroup
          color="primary"
          value={statusFilter}
          exclusive
          onChange={(e, val) => val && setStatusFilter(val)}
          size="small"
        >
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <MaterialReactTable
        columns={columns}
        data={displayedClients}
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