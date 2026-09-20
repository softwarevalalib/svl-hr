import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children }) => {
  const { loading, user } = useAuth();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (loading && !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
