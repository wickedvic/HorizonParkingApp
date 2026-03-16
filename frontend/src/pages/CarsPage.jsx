"use client"
import React, { useMemo, useState, useEffect } from "react"
import API_BASE_URL from "../api.js"
import { MaterialReactTable } from 'material-react-table';

export default function CarsPage() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/cars`)
      .then((res) => res.json())
      .then((data) => setCars(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const columns = useMemo(() => [
    { accessorKey: "license_plate", header: "License Plate" },
    { accessorKey: "make", header: "Make" },
    { accessorKey: "model", header: "Model" },
  ], []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>All Vehicles</h2>
      <MaterialReactTable columns={columns} data={cars} />
    </div>
  );
}