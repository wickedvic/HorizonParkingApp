"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Divider,
  Button
} from "@mui/material";
import { 
  BarChart as ChartIcon, 
  DirectionsCar as CarIcon, 
  People as PeopleIcon, 
  LocalLabel as PermitIcon,
  Payments as MoneyIcon,
  Download as DownloadIcon
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function ReportsPage({ user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState({
    cars: [],
    clients: [],
    permits: [],
    payments: []
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [c, cl, pr, py] = await Promise.all([
        fetch(`${API_BASE_URL}/cars`).then(res => res.json()),
        fetch(`${API_BASE_URL}/clients`).then(res => res.json()),
        fetch(`${API_BASE_URL}/permits`).then(res => res.json()),
        fetch(`${API_BASE_URL}/payments`).then(res => res.json()),
      ]);
      
      setData({
        cars: Array.isArray(c) ? c : [],
        clients: Array.isArray(cl) ? cl : [],
        permits: Array.isArray(pr) ? pr : [],
        payments: Array.isArray(py) ? py : []
      });
    } catch (err) {
      console.error("Report load failed", err);
    }
  };

  // Summary Metrics
  const stats = useMemo(() => ({
    revenue: data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    activePermits: data.permits.filter(p => new Date(p.PermitEndDate) >= new Date()).length,
    totalClients: data.clients.length,
    totalCars: data.cars.length
  }), [data]);

  // Define table columns based on the selected tab
  const columns = useMemo(() => {
    if (activeTab === 0) { // Clients Report
      return [
        { accessorKey: "firstName", header: "First Name" },
        { accessorKey: "lastName", header: "Last Name" },
        { accessorKey: "status", header: "Status" },
        { accessorKey: "email", header: "Email" },
      ];
    } else if (activeTab === 1) { // Revenue Report
      return [
        { accessorKey: "created_at", header: "Date" },
        { accessorKey: "payer", header: "Payer ID" },
        { accessorKey: "month", header: "Month" },
        { accessorKey: "amount", header: "Amount", Cell: ({ cell }) => `$${cell.getValue().toFixed(2)}` },
      ];
    } else { // Vehicles Report
      return [
        { accessorKey: "make", header: "Make" },
        { accessorKey: "model", header: "Model" },
        { accessorKey: "license_plate", header: "Plate" },
        { accessorKey: "owner_id", header: "Owner ID" },
      ];
    }
  }, [activeTab]);

  const currentTableData = activeTab === 0 ? data.clients : activeTab === 1 ? data.payments : data.cars;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          System Analytics
        </Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.print()}>
          Export PDF
        </Button>
      </Stack>

      {/* TOP STAT CARDS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Revenue", val: `$${stats.revenue.toFixed(2)}`, icon: <MoneyIcon />, color: '#2e7d32' },
          { label: "Active Permits", val: stats.activePermits, icon: <PermitIcon />, color: '#ed6c02' },
          { label: "Total Clients", val: stats.totalClients, icon: <PeopleIcon />, color: '#0288d1' },
          { label: "Total Vehicles", val: stats.totalCars, icon: <CarIcon />, color: '#7b1fa2' },
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">{item.label}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{item.val}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* DATA EXPLORER TABS */}
      <Paper sx={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f9fa' }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} aria-label="report tabs">
            <Tab icon={<PeopleIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Client Growth" />
            <Tab icon={<MoneyIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Revenue Audit" />
            <Tab icon={<CarIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Inventory List" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <MaterialReactTable
            columns={columns}
            data={currentTableData}
            enableGlobalFilter
            enableDensityToggle={false}
            initialState={{ density: 'compact' }}
            muiTablePaperProps={{ elevation: 0 }}
          />
        </Box>
      </Paper>
    </Box>
  );
}