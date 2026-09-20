import React, { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, message, Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, KeyOutlined, UserOutlined } from '@ant-design/icons';
import { api } from '../services/authService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [u, r, e] = await Promise.all([
        api.get('/users'),
        api.get('/roles'),
        api.get('/employees'),
      ]);
      if (u.data.success) setUsers(u.data.data);
      if (r.data.success) setRoles(r.data.data);
      if (e.data.success) setEmployees(e.data.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, role_ids: [5], user_level: 'Employee' });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      const res = await api.get(`/users/${record.id}`);
      const data = res.data.data;
      setEditing(data);
      form.setFieldsValue({
        username: data.username,
        email: data.email,
        employee_id: data.employee_id,
        user_level: data.user_level,
        role_ids: (data.roles || []).map((r) => r.id),
        is_active: data.is_active !== 0,
      });
      setModalOpen(true);
    } catch (err) {
      message.error('Failed to load user');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          email: values.email,
          employee_id: values.employee_id || null,
          user_level: values.user_level,
          role_ids: values.role_ids,
          is_active: values.is_active ? 1 : 0,
        });
        message.success('User updated');
      } else {
        await api.post('/users', {
          ...values,
          is_active: values.is_active ? 1 : 0,
        });
        message.success('User created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      message.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await api.post(`/users/${editing.id}/reset-password`, { password: values.password });
      message.success('Password reset');
      setPasswordModal(false);
      pwdForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || 'Reset failed');
    }
  };

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Employee', dataIndex: 'employee_name', key: 'employee_name', render: (v) => v || '—' },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (v) => (v ? v.split(', ').map((r) => <Tag key={r}>{r}</Tag>) : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v) => <Tag color={v === 0 ? 'red' : 'green'}>{v === 0 ? 'Inactive' : 'Active'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Button
            icon={<KeyOutlined />}
            size="small"
            onClick={() => {
              setEditing(record);
              setPasswordModal(true);
            }}
          />
          <Popconfirm title="Deactivate this user?" onConfirm={async () => {
            try {
              await api.delete(`/users/${record.id}`);
              message.success('User deactivated');
              load();
            } catch (err) {
              message.error(err.response?.data?.message || 'Failed');
            }
          }}>
            <Button danger size="small">Deactivate</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span><UserOutlined style={{ marginRight: 8 }} />User Management</span>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Create User</Button>}
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={users} pagination={{ pageSize: 10 }} />

      <Modal
        title={editing ? 'Edit User' : 'Create User'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="employee_id" label="Linked Employee">
            <Select allowClear showSearch optionFilterProp="label"
              options={employees.map((e) => ({
                value: e.id,
                label: `${e.first_name} ${e.last_name} (${e.employee_id || e.id})`,
              }))}
            />
          </Form.Item>
          <Form.Item name="user_level" label="Display Level">
            <Select options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Manager', label: 'Manager' },
              { value: 'Employee', label: 'Employee' },
            ]} />
          </Form.Item>
          <Form.Item name="role_ids" label="Roles" rules={[{ required: true, message: 'Select at least one role' }]}>
            <Select mode="multiple" options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Reset Password"
        open={passwordModal}
        onCancel={() => setPasswordModal(false)}
        onOk={() => pwdForm.submit()}
        destroyOnClose
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item name="password" label="New Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Users;
