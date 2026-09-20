import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Input, Tabs, Tag, message } from 'antd';
import { PlusOutlined, ShoppingOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { authService } from '../services/authService';

const { TabPane } = Tabs;

const Procurement = () => {
  const [vendors, setVendors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorForm] = Form.useForm();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await axios.get('/api/procurement/vendors', { headers });
      if (res.data.success) setVendors(res.data.data);
    } catch (error) {
      message.error('Failed to load vendors');
    }
  }, [headers]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/procurement/requests', { headers });
      if (res.data.success) setRequests(res.data.data);
    } catch (error) {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await axios.get('/api/procurement/orders', { headers });
      if (res.data.success) setOrders(res.data.data);
    } catch (error) {
      message.error('Failed to load orders');
    }
  }, [headers]);

  const fetchBids = useCallback(async () => {
    try {
      const res = await axios.get('/api/procurement/bids/opportunities', { headers });
      if (res.data.success) setBids(res.data.data);
    } catch (error) {
      message.error('Failed to load bid opportunities');
    }
  }, [headers]);

  useEffect(() => {
    fetchVendors();
    fetchRequests();
    fetchOrders();
    fetchBids();
  }, [fetchVendors, fetchRequests, fetchOrders, fetchBids]);



  const handleAddVendor = async (values) => {
    try {
      const res = await axios.post('/api/procurement/vendors', values, { headers });
      if (res.data.success) {
        message.success('Vendor added successfully');
        setVendorModalVisible(false);
        vendorForm.resetFields();
        fetchVendors();
      }
    } catch (error) {
      message.error('Failed to add vendor');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'processing',
      'Approved': 'success',
      'Rejected': 'error',
      'Active': 'success',
      'Open': 'processing',
      'Closed': 'default'
    };
    return colors[status] || 'default';
  };

  return (
    <div>
      <Card 
        title={<span><ShoppingOutlined style={{ marginRight: 8 }} />Procurement Management</span>}
      >
        <Tabs defaultActiveKey="vendors">
          <TabPane tab="Vendors" key="vendors">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setVendorModalVisible(true)} style={{ marginBottom: 16 }}>
              Add Vendor
            </Button>
            <Table
              columns={[
                { title: 'Code', dataIndex: 'vendor_code', key: 'code' },
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Contact', dataIndex: 'contact_person', key: 'contact' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Phone', dataIndex: 'phone', key: 'phone' },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={getStatusColor(status)}>{status}</Tag>
                }
              ]}
              dataSource={vendors}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Purchase Requests" key="requests">
            <Table
              columns={[
                { title: 'Request #', dataIndex: 'request_number', key: 'request_number' },
                { title: 'Requester', dataIndex: 'requester_name', key: 'requester' },
                { title: 'Department', dataIndex: 'department_name', key: 'department' },
                { title: 'Total Cost', dataIndex: 'total_estimated_cost', key: 'cost', render: (val) => `$${val || 0}` },
                { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (priority) => 
                  <Tag color={priority === 'Urgent' ? 'red' : priority === 'High' ? 'orange' : 'blue'}>{priority}</Tag>
                },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={getStatusColor(status)}>{status}</Tag>
                }
              ]}
              dataSource={requests}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Bid Opportunities" key="bids">
            <Table
              columns={[
                { title: 'Opportunity #', dataIndex: 'opportunity_number', key: 'opportunity_number' },
                { title: 'Title', dataIndex: 'title', key: 'title' },
                { title: 'Closing Date', dataIndex: 'bid_closing_date', key: 'closing', render: (date) => 
                  dayjs(date).format('MMM DD, YYYY')
                },
                { title: 'Estimated Value', dataIndex: 'estimated_value', key: 'value', render: (val) => `$${val || 0}` },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={getStatusColor(status)}>{status}</Tag>
                }
              ]}
              dataSource={bids}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Purchase Orders" key="orders">
            <Table
              columns={[
                { title: 'PO #', dataIndex: 'po_number', key: 'po_number' },
                { title: 'Vendor', dataIndex: 'vendor_name', key: 'vendor' },
                { title: 'Total Amount', dataIndex: 'total_amount', key: 'amount', render: (val) => `$${val || 0}` },
                { title: 'Expected Delivery', dataIndex: 'expected_delivery_date', key: 'delivery', render: (date) => 
                  date ? dayjs(date).format('MMM DD, YYYY') : '-'
                },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={getStatusColor(status)}>{status}</Tag>
                },
                {
                  title: 'Export',
                  key: 'pdf',
                  render: (_, record) => (
                    <Button
                      size="small"
                      icon={<FilePdfOutlined />}
                      onClick={() => authService.downloadPdf(`/export/purchase-order/${record.id}.pdf`, `po-${record.po_number || record.id}.pdf`)}
                    >
                      PDF
                    </Button>
                  ),
                },
              ]}
              dataSource={orders}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title="Add Vendor" open={vendorModalVisible} onCancel={() => setVendorModalVisible(false)} onOk={() => vendorForm.submit()}>
        <Form form={vendorForm} onFinish={handleAddVendor} layout="vertical">
          <Form.Item name="vendor_code" label="Vendor Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Vendor Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact_person" label="Contact Person">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Procurement;
