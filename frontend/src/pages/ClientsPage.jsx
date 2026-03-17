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
  Stack,
  Grid
} from "@mui/material";
import { 
  DirectionsCar as CarIcon, 
  ConfirmationNumber as PermitIcon 
} from "@mui/icons-material";
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
    []
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
          const rawPermits = row.original.permitNumber;
          const permitList = rawPermits ? rawPermits.toString().split(',').map(p => p.trim()) : [];

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
                    <Typography variant="body2" color="text.secondary">No vehicles found.</Typography>
                  )}
                </Grid>

                {/* PERMITS SECTION */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                    <PermitIcon fontSize="small" color="secondary" /> Active Permits
                  </Typography>
                  {permitList.length > 0 ? (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                      {permitList.map((permit, idx) => (
                        <React.Fragment key={idx}>
                          <ListItem>
                            <ListItemText 
                              primary={
                                <Link
                                  component="button"
                                  variant="body2"
                                  onClick={() => onNavigatePermit(permit)}
                                  sx={{ fontWeight: 'bold', textDecoration: 'none' }}
                                >
                                  Permit #{permit}
                                </Link>
                              }
                              secondary="Click to view permit details"
                            />
                          </ListItem>
                          {idx < permitList.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No permits found.</Typography>
                  )}
                </Grid>
              </Grid>
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