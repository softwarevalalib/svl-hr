import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Tabs, Tag, message, Space } from 'antd';
import { PlusOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { Option } = Select;

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/payroll', { headers });
      if (res.data.success) setPayrolls(res.data.data);
    } catch (error) {
      message.error('Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchComponents = useCallback(async () => {
    try {
      const res = await axios.get('/api/payroll/components', { headers });
      if (res.data.success) setComponents(res.data.data);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  }, [headers]);

  useEffect(() => {
    fetchPayrolls();
    fetchComponents();
  }, [fetchPayrolls, fetchComponents]);



  const handleAddPayroll = async (values) => {
    try {
      const res = await axios.post('/api/payroll', values, { headers });
      if (res.data.success) {
        message.success('Payroll created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchPayrolls();
      }
    } catch (error) {
      message.error('Failed to create payroll');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Processing': 'processing',
      'Completed': 'success',
      'Approved': 'success'
    };
    return colors[status] || 'default';
  };

  const payrollColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Department', dataIndex: 'department_name', key: 'department' },
    { title: 'Period', key: 'period', render: (_, record) => 
      `${dayjs(record.date_start).format('MMM DD')} - ${dayjs(record.date_end).format('MMM DD, YYYY')}` 
    },
    { title: 'Total Amount', dataIndex: 'total_amount', key: 'amount', render: (val) => `$${val || 0}` },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => message.info('View payroll details')}>View</Button>
          <Button size="small" type="primary" onClick={() => message.info('Process payroll')}>Process</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title={
          <span>
            <DollarOutlined style={{ marginRight: 8 }} />
            Payroll Management
          </span>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            New Payroll
          </Button>
        }
      >
        <Tabs defaultActiveKey="payrolls">
          <TabPane tab="Payrolls" key="payrolls">
            <Table
              columns={payrollColumns}
              dataSource={payrolls}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Salary Components" key="components">
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Details', dataIndex: 'details', key: 'details' },
                { title: 'Status', dataIndex: 'is_active', key: 'status', render: (val) => 
                  <Tag color={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
                }
              ]}
              dataSource={components}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="Create New Payroll"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleAddPayroll} layout="vertical">
          <Form.Item name="name" label="Payroll Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="pay_period" label="Pay Period">
            <Select>
              <Option value="Monthly">Monthly</Option>
              <Option value="Bi Weekly">Bi Weekly</Option>
              <Option value="Weekly">Weekly</Option>
            </Select>
          </Form.Item>
          <Form.Item name="date_start" label="Start Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date_end" label="End Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Payroll;
