import React from 'react';
import { Result, Button } from 'antd';
import { useAuth } from '../../context/AuthContext';

const PermissionRoute = ({ permission, children }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;

  if (permission && !hasPermission(permission)) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle="You do not have permission to view this page."
        extra={
          <Button type="primary" href="/dashboard">
            Back to Dashboard
          </Button>
        }
      />
    );
  }

  return children;
};

export default PermissionRoute;
