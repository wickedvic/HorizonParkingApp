"use client"

import React, { useState, useEffect, useMemo } from "react"
import API_BASE_URL from "../api.js"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip
} from "@mui/material";
import { 
  Paid as PaidIcon, 
  CalendarMonth as MonthIcon, 
  Person as PersonIcon 
} from "@mui/icons-material";
import { MaterialReactTable } from 'material-react-table';

export default function PaymentsPage({ user }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments`);
      const data = await res.json();
      
      // MASSAGE DATA: Remove rows that don't have a Payer ID or an Amount
      // This cleans up legacy "null" rows from the SQL dump
      const cleanData = Array.isArray(data) ? data.filter(p => 
        p.payer && p.amount > 0 && p.month
      ) : [];

      setPayments(cleanData);
    } catch (err) {
      console.error("Failed to load payments:", err);
      setPayments([]);
    }
  };

  const totalRevenue = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "created_at",
        header: "Date Recorded",
        size: 180,
        // Only show date part if timestamp is messy
        Cell: ({ cell }) => cell.getValue()?.split(' ')[0] || "N/A",
      },
      {
        accessorKey: "payer",
        header: "Payer ID",
        size: 100,
        Cell: ({ cell }) => (
          <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            {cell.getValue()}
          </Typography>
        ),
      },
      {
        accessorKey: "month",
        header: "Billing Period",
        Cell: ({ cell }) => (
          <Stack direction="row" alignItems="center" spacing={1}>
            <MonthIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography>{cell.getValue()}</Typography>
          </Stack>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        Cell: ({ cell }) => (
          <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
            ${(cell.getValue() || 0).toFixed(2)}
          </Typography>
        ),
      },
      {
        accessorKey: "added_by",
        header: "Processed By",
        size: 120,
        // Don't show if every single row says the same admin name (optional)
        Cell: ({ cell }) => (
          <Chip 
            label={cell.getValue() || 'System'} 
            size="small" 
            variant="outlined" 
            icon={<PersonIcon sx={{ fontSize: '14px !important' }} />} 
          />
        ),
      },
    ],
    []
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Billing & Payments
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0', bgcolor: '#f8fff9' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ bgcolor: 'success.main', p: 1, borderRadius: '8px', display: 'flex' }}>
                  <PaidIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="overline">Total Revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                    ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: '8px', display: 'flex' }}>
                  <MonthIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography color="text.secondary" variant="overline">Valid Transactions</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {payments.length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <MaterialReactTable
        columns={columns}
        data={payments}
        enableColumnOrdering
        enableGlobalFilter
        // HIDE EMPTY COLUMNS: If a column is entirely null, MRT allows users to hide it, 
        // but we've already massaged the data above to prevent this.
        initialState={{ 
          density: 'compact',
          sorting: [{ id: 'created_at', desc: true }],
          columnVisibility: { id: false } // Hide ID column by default as it's just DB noise
        }}
        muiTablePaperProps={{
          elevation: 2,
          sx: { borderRadius: '12px' }
        }}
      />
    </Box>
  );
}