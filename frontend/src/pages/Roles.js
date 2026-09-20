import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Checkbox, Space, message, Tag, Collapse } from 'antd';
import { PlusOutlined, EditOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { api } from '../services/authService';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([api.get('/roles'), api.get('/roles/permissions')]);
      if (r.data.success) setRoles(r.data.data);
      if (p.data.success) setPermissions(p.data.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    });
    return map;
  }, [permissions]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ permission_ids: [] });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    try {
      const res = await api.get(`/roles/${record.id}`);
      const data = res.data.data;
      setEditing(data);
      form.setFieldsValue({
        name: data.name,
        description: data.description,
        permission_ids: (data.permissions || []).map((p) => p.id),
      });
      setModalOpen(true);
    } catch (err) {
      message.error('Failed to load role');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editing) {
        await api.put(`/roles/${editing.id}`, values);
        message.success('Role updated — permissions apply within ~30s for active sessions');
      } else {
        await api.post('/roles', values);
        message.success('Role created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      message.error(err.response?.data?.message || 'Save failed');
    }
  };

  const columns = [
    { title: 'Role', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Type',
      dataIndex: 'is_system',
      key: 'is_system',
      render: (v) => (v ? <Tag color="blue">System</Tag> : <Tag>Custom</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
            Permissions
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={<span><SafetyCertificateOutlined style={{ marginRight: 8 }} />Roles & Permissions</span>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Create Role</Button>}
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={roles} pagination={false} />

      <Modal
        title={editing ? `Edit Role: ${editing.name}` : 'Create Role'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Role Name" rules={[{ required: true }]}>
            <Input disabled={!!editing?.is_system} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="permission_ids" label="Permissions">
            <Checkbox.Group style={{ width: '100%' }}>
              <Collapse
                items={Object.keys(grouped).map((module) => ({
                  key: module,
                  label: module.charAt(0).toUpperCase() + module.slice(1),
                  children: (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {grouped[module].map((p) => (
                        <Checkbox key={p.id} value={p.id}>
                          {p.name} <Tag style={{ marginLeft: 4 }}>{p.code}</Tag>
                        </Checkbox>
                      ))}
                    </div>
                  ),
                }))}
              />
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Roles;
