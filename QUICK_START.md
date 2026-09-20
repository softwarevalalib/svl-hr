# 🚀 Quick Start Guide

## Installation Complete!

Your SVL Human Resource Management (React + Node.js + SQLite) system has been successfully set up!

## How to Run

### Option 1: Automated Setup (First Time)

```bash
cd /Users/user/Desktop/hr_system/hr_system_react
./setup.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd hr_system_react/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd hr_system_react/frontend
npm install
npm start
```

### Option 3: Quick Start Script

```bash
cd hr_system_react
./start.sh
```

## Access the Application

1. Open browser: http://localhost:3000
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`

## ✅ What's Working

- ✅ SQLite database initialized
- ✅ Backend API server (port 3001)
- ✅ Employee management CRUD
- ✅ Authentication & JWT
- ✅ React frontend with Ant Design
- ✅ Dashboard with statistics
- ✅ Department management
- ✅ Attendance tracking API
- ✅ Leave management API

## 📋 Available Pages

- **Dashboard** - Overview and statistics
- **Employees** - Manage employees (Add, Edit, Delete, View)
- **Attendance** - Track employee attendance
- **Leave Management** - Manage leave requests

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Employees
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/stats/summary` - Get statistics

### Departments
- `GET /api/departments` - List departments
- `GET /api/departments/:id` - Get department details

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Create attendance record

### Leave
- `GET /api/leave/types` - List leave types
- `GET /api/leave` - List leave requests
- `POST /api/leave` - Create leave request

## 🗄️ Database

Location: `hr_system_react/database/hr_system.db`

To reinitialize:
```bash
cd hr_system_react/backend
npm run init-db
```

## 🛠️ Development

### Backend
```bash
cd hr_system_react/backend
npm run dev  # Auto-reload on changes
```

### Frontend
```bash
cd hr_system_react/frontend
npm start  # Already has hot-reload
```

## 📝 Next Steps

1. Start exploring the employee management features
2. Add test employees
3. View the dashboard statistics
4. Explore the API endpoints

## 🐛 Troubleshooting

### Backend won't start
```bash
cd hr_system_react/backend
npm run init-db
npm start
```

### Frontend won't start
```bash
cd hr_system_react/frontend
npm install
npm start
```

### Database locked
```bash
cd hr_system_react
rm database/hr_system.db
cd backend
npm run init-db
```

## 📚 Documentation

See `README.md` for complete documentation.

## 🎉 Enjoy Your HR System!

This is a modern, fully-functional HR management system built with:
- **React 18** for the frontend
- **Node.js & Express** for the backend
- **SQLite** for data storage
- **Ant Design** for beautiful UI components
- **JWT** for secure authentication

