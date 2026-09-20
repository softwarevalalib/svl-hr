import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Statistic, Row, Col, Tabs } from 'antd';
import { PlusOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const LeaveManagement = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission(['export.pdf', 'leave.view', 'leave.self']);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leave', { headers });
      if (res.data.success) setLeaveRequests(res.data.data);
    } catch (error) {
      message.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await axios.get('/api/leave/types', { headers });
      if (res.data.success) setLeaveTypes(res.data.data);
    } catch (error) {
      message.error('Failed to load leave types');
    }
  }, [headers]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeService.getAll();
      if (res.success) setEmployees(res.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchEmployees();
  }, [fetchLeaveRequests, fetchLeaveTypes, fetchEmployees]);

  const handleAddLeaveRequest = async (values) => {
    try {
      const dateRange = values.date_range;
      const days = dateRange[1].diff(dateRange[0], 'day') + 1;
      
      const res = await axios.post('/api/leave', {
        ...values,
        date_start: dateRange[0].format('YYYY-MM-DD'),
        date_end: dateRange[1].format('YYYY-MM-DD'),
        days: days,
      }, { headers });
      
      if (res.data.success) {
        message.success('Leave request created successfully');
        setModalVisible(false);
        form.resetFields();
        fetchLeaveRequests();
      }
    } catch (error) {
      message.error('Failed to create leave request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'processing',
      'Approved': 'success',
      'Rejected': 'error',
      'Cancelled': 'default'
    };
    return colors[status] || 'default';
  };

  const pendingRequests = leaveRequests.filter(lr => lr.status === 'Pending');
  const approvedThisMonth = leaveRequests.filter(lr => 
    lr.status === 'Approved' && dayjs(lr.date_start).isSame(dayjs(), 'month')
  ).length;

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Leave Type',
      dataIndex: 'leave_type_name',
      key: 'leave_type',
    },
    {
      title: 'Start Date',
      dataIndex: 'date_start',
      key: 'date_start',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date_start).unix() - dayjs(b.date_start).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'date_end',
      key: 'date_end',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      render: (days) => `${days} day${days > 1 ? 's' : ''}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Pending' && (
            <>
              <Button size="small" type="primary" onClick={() => message.info('Approve functionality coming soon')}>
                Approve
              </Button>
              <Button size="small" danger onClick={() => message.info('Reject functionality coming soon')}>
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending Requests" value={pendingRequests.length} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Approved This Month" value={approvedThisMonth} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Requests" value={leaveRequests.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Leave Types" value={leaveTypes.length} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Leave Management
          </span>
        }
        extra={
          <Space>
            {canExport && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => authService.downloadPdf('/export/leave.pdf', 'leave-summary.pdf')}
              >
                Export PDF
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              New Leave Request
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="all">
          <TabPane tab="All Requests" key="all">
            <Table
              columns={columns}
              dataSource={leaveRequests}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Pending" key="pending">
            <Table
              columns={columns}
              dataSource={pendingRequests}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Approved" key="approved">
            <Table
              columns={columns}
              dataSource={leaveRequests.filter(lr => lr.status === 'Approved')}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Leave Types" key="types">
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Default Quota', dataIndex: 'default_quota', key: 'quota', render: (val) => `${val} days` },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={status === 'Active' ? 'success' : 'default'}>{status}</Tag>
                },
              ]}
              dataSource={leaveTypes}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="New Leave Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleAddLeaveRequest} layout="vertical">
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee">
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="leave_type_id" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select leave type">
              {leaveTypes.filter(lt => lt.status === 'Active').map(type => (
                <Option key={type.id} value={type.id}>{type.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date_range" label="Date Range" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <TextArea rows={4} placeholder="Enter reason for leave" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;

