import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/projects', values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Project created successfully');
      setModalVisible(false);
      fetchProjects();
    } catch (error) {
      message.error('Failed to create project');
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Client', dataIndex: 'client_name', key: 'client_name' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div>
      <Card
        title="Projects"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Project
          </Button>
        }
      >
        <Table
          dataSource={projects}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="Add Project"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="code" label="Code">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="client_name" label="Client">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Projects;
