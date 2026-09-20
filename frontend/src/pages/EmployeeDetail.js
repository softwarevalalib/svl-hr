import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { employeeService } from '../services/employeeService';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      const response = await employeeService.getById(id);
      setEmployee(response.data);
    } catch (error) {
      message.error('Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: 50 }} />;
  }

  if (!employee) {
    return null;
  }

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} style={{ marginBottom: 16 }}>
        Back to Employees
      </Button>

      <Card title="Employee Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Employee ID">{employee.employee_id}</Descriptions.Item>
          <Descriptions.Item label="Full Name">
            {employee.first_name} {employee.middle_name} {employee.last_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{employee.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{employee.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Department">{employee.department || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Job Title">{employee.job_title || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Status">{employee.status}</Descriptions.Item>
          <Descriptions.Item label="Joined Date">{employee.joined_date || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default EmployeeDetail;

