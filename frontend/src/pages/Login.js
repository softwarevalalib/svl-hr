import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      message.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="login-brand">SVL</h1>
          <p style={{ color: '#5c6b7a', marginTop: 8 }}>Human Resource Management</p>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#8a97a5', fontSize: 12 }}>
            <p>Default: admin / admin123</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
