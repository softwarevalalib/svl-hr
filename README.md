# SVL Human Resource Management - React + Node.js + SQLite

A modern Human Resource Management System built with React, Node.js, and SQLite.

## 🚀 Features

- **Employee Management** - Full CRUD operations for employees
- **Dashboard** - Overview statistics and key metrics
- **Attendance Tracking** - Record and manage attendance
- **Leave Management** - Leave requests and approvals
- **Department Management** - Organize employees by departments
- **User Authentication** - Secure login with JWT tokens
- **SQLite Database** - Lightweight, file-based database
- **Modern UI** - Built with Ant Design components

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Initialize Database

```bash
npm run init-db
```

This will create the SQLite database with all necessary tables and seed data.

### 3. Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Backend will run on `http://localhost:3001`

### 4. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 5. Start Frontend Development Server

```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Login

- **Username:** `admin`
- **Password:** `admin123`

## 📁 Project Structure

```
hr_system_react/
├── backend/
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── departments.js
│   │   ├── attendance.js
│   │   └── leave.js
│   ├── scripts/         # Utility scripts
│   │   └── initDatabase.js
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
│   └── package.json
├── database/
│   ├── init.sql         # Database schema
│   └── hr_system.db     # SQLite database (created)
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/stats/summary` - Get statistics

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record

### Leave
- `GET /api/leave/types` - Get leave types
- `GET /api/leave` - Get leave requests
- `POST /api/leave` - Create leave request

## 🗄️ Database Schema

The system uses SQLite with the following main tables:
- Users
- Employees
- Departments
- JobTitles
- EmploymentStatus
- Attendance
- LeaveTypes
- LeaveRequests
- Documents
- Settings
- AuditLog

## 🎨 Technology Stack

### Frontend
- React 18
- Ant Design 5
- React Router 6
- Axios
- Day.js

### Backend
- Node.js
- Express.js
- SQLite3
- JWT Authentication
- Bcrypt

## 🚢 Build for Production

### Frontend
```bash
cd frontend
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Backend
The backend is ready for production deployment. You may want to:
- Set environment variables (JWT_SECRET, PORT)
- Use PM2 for process management
- Configure reverse proxy (nginx)

## 📝 Environment Variables

Create a `.env` file in the backend directory:

```
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=production
```

## 🤝 Contributing

SVL Human Resource Management - A comprehensive HR management system built with React + Node.js + SQLite.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built on modern web technologies
- Ant Design team for the excellent UI component library
- React and Node.js communities

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/icehrm-react/issues
- Documentation: See inline code comments

## 🎯 Next Steps

Potential enhancements:
- [ ] Complete attendance tracking UI
- [ ] Complete leave management UI
- [ ] Add employee documents management
- [ ] Implement reporting features
- [ ] Add more analytics to dashboard
- [ ] Role-based access control
- [ ] Email notifications
- [ ] Export data to Excel/PDF
- [ ] Mobile responsive improvements

