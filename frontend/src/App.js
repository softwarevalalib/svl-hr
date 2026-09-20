import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Training from './pages/Training';
import Projects from './pages/Projects';
import Expenses from './pages/Expenses';
import Performance from './pages/Performance';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Payroll from './pages/Payroll';
import Finance from './pages/Finance';
import Procurement from './pages/Procurement';
import Users from './pages/Users';
import Roles from './pages/Roles';
import WorkSchedule from './pages/WorkSchedule';
import AppLayout from './components/common/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard.view"><Dashboard /></PermissionRoute>} />
          <Route path="employees" element={<PermissionRoute permission={['employees.view', 'employees.manage']}><Employees /></PermissionRoute>} />
          <Route path="employees/:id" element={<PermissionRoute permission={['employees.view', 'employees.manage']}><EmployeeDetail /></PermissionRoute>} />
          <Route path="attendance" element={<PermissionRoute permission={['attendance.view', 'attendance.manage', 'attendance.self']}><Attendance /></PermissionRoute>} />
          <Route path="leave" element={<PermissionRoute permission={['leave.view', 'leave.manage', 'leave.self']}><LeaveManagement /></PermissionRoute>} />
          <Route path="training" element={<PermissionRoute permission={['training.view', 'training.manage']}><Training /></PermissionRoute>} />
          <Route path="projects" element={<PermissionRoute permission={['projects.view', 'projects.manage']}><Projects /></PermissionRoute>} />
          <Route path="expenses" element={<PermissionRoute permission={['expenses.view', 'expenses.manage', 'expenses.self']}><Expenses /></PermissionRoute>} />
          <Route path="performance" element={<PermissionRoute permission={['performance.view', 'performance.manage']}><Performance /></PermissionRoute>} />
          <Route path="reports" element={<PermissionRoute permission="reports.view"><Reports /></PermissionRoute>} />
          <Route path="analytics" element={<PermissionRoute permission="analytics.view"><Analytics /></PermissionRoute>} />
          <Route path="payroll" element={<PermissionRoute permission={['payroll.view', 'payroll.manage']}><Payroll /></PermissionRoute>} />
          <Route path="finance" element={<PermissionRoute permission={['finance.view', 'finance.manage']}><Finance /></PermissionRoute>} />
          <Route path="procurement" element={<PermissionRoute permission={['procurement.view', 'procurement.manage']}><Procurement /></PermissionRoute>} />
          <Route path="users" element={<PermissionRoute permission="users.manage"><Users /></PermissionRoute>} />
          <Route path="roles" element={<PermissionRoute permission="roles.manage"><Roles /></PermissionRoute>} />
          <Route path="settings/work-schedule" element={<PermissionRoute permission="settings.manage"><WorkSchedule /></PermissionRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
