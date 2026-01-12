# Parking Management System

A complete parking lot management application with Node.js backend, React frontend, and SQLite database.

## Features

- User authentication with role-based access (Admin, Front Desk, Read-Only)
- Client and vehicle registration
- Parking permit generation (daily, monthly, custom ranges)
- Payment tracking and management
- Revenue reports with date range filtering
- Responsive web interface

## Project Structure

\`\`\`
parking-app/
├── server.js              # Node.js/Express backend
├── parking.db             # SQLite database (auto-created)
├── package.json           # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── main.jsx      # React entry point
│   │   ├── App.jsx       # Main app component
│   │   ├── index.css     # Global styles
│   │   └── pages/        # Page components
│   ├── index.html        # HTML template
│   ├── vite.config.js    # Vite configuration
│   └── package.json      # Frontend dependencies
└── README.md             # This file
\`\`\`

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager

## Installation & Setup

### 1. Backend Setup

\`\`\`bash
# Install backend dependencies
npm install

# Start the backend server
npm start
# Server runs on http://localhost:5000
\`\`\`

### 2. Frontend Setup

\`\`\`bash
# Open a new terminal window
cd frontend

# Install frontend dependencies
npm install

# Start the development server
npm run dev
# Frontend runs on http://localhost:3000
\`\`\`

## Access the Application

Open your browser and go to `http://localhost:3000`

### Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | artie ||
| Admin | david ||
| Admin | marc ||
| Admin | it ||
| Front Desk | frontdesk ||

## Features by Role

### Admin
- Full access to all features
- Create and manage clients
- Register vehicles
- Create parking permits
- Mark payments as paid
- View all reports

### Front Desk
- Create temporary permits
- View client and vehicle information
- View payment history
- View reports

### Read-Only
- View-only access to all data
- Cannot make any changes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create new client

### Vehicles
- `GET /api/cars` - Get all vehicles
- `POST /api/cars` - Register new vehicle

### Permits
- `GET /api/permits` - Get all permits
- `POST /api/permits` - Create new permit

### Payments
- `GET /api/payments` - Get all payments
- `PATCH /api/payments/:id` - Update payment status

### Reports
- `GET /api/reports` - Get reports with optional date filtering

## Database Schema

### users
- id, username, password, role, created_at

### clients
- id, first_name, last_name, email, phone, company, created_at, updated_at

### cars
- id, client_id, license_plate, make, model, color, year, created_at, updated_at

### permits
- id, permit_number, car_id, permit_type, start_date, end_date, daily_rate, total_cost, created_at, updated_at

### payments
- id, permit_id, client_id, amount, is_paid, paid_date, created_at, updated_at

## Troubleshooting

### Port already in use
- Backend: Change port in server.js (default 5000)
- Frontend: Change port in frontend/vite.config.js (default 3000)

### Database errors
- Delete parking.db and restart the server to reset database

### CORS errors
- Ensure backend is running on http://localhost:5000
- Check CORS settings in server.js

## Development Notes

- Database is automatically created on first run with sample data
- All passwords are stored in plain text (for demo purposes only)
- For production, implement proper authentication and password hashing

## License

MIT
# HorizonParkingApp
