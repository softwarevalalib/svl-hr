import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const Training = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/training/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(response.data.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch courses');
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
      await axios.post('/api/training/courses', values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Course created successfully');
      setModalVisible(false);
      fetchCourses();
    } catch (error) {
      message.error('Failed to create course');
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Trainer', dataIndex: 'trainer', key: 'trainer' },
    { title: 'Cost', dataIndex: 'cost', key: 'cost', render: (val) => `$${val || 0}` },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div>
      <Card
        title="Training Courses"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Course
          </Button>
        }
      >
        <Table
          dataSource={courses}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="Add Course"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="trainer" label="Trainer">
            <Input />
          </Form.Item>
          <Form.Item name="payment_type" label="Payment Type">
            <Select>
              <Option value="Company Sponsored">Company Sponsored</Option>
              <Option value="Paid by Employee">Paid by Employee</Option>
            </Select>
          </Form.Item>
          <Form.Item name="cost" label="Cost">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Training;
