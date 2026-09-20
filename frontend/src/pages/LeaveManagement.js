import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Statistic, Row, Col, Tabs, Popconfirm,
} from 'antd';
import {
  PlusOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';
import { authService, api } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LeaveManagement = () => {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission('leave.manage');
  const canExport = hasPermission(['export.pdf', 'leave.view', 'leave.self']);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [updatingId, setUpdatingId] = useState(null);

  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave');
      if (res.data.success) setLeaveRequests(res.data.data);
    } catch (error) {
      message.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await api.get('/leave/types');
      if (res.data.success) setLeaveTypes(res.data.data);
    } catch (error) {
      message.error('Failed to load leave types');
    }
  }, []);

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
    if (canManage) fetchEmployees();
  }, [fetchLeaveRequests, fetchLeaveTypes, fetchEmployees, canManage]);

  const handleAddLeaveRequest = async (values) => {
    try {
      const dateRange = values.date_range;
      const days = dateRange[1].diff(dateRange[0], 'day') + 1;
      const payload = {
        leave_type_id: values.leave_type_id,
        date_start: dateRange[0].format('YYYY-MM-DD'),
        date_end: dateRange[1].format('YYYY-MM-DD'),
        days,
        reason: values.reason,
      };
      if (values.employee_id) payload.employee_id = values.employee_id;

      const res = await api.post('/leave', payload);
      if (res.data.success) {
        message.success('Leave request submitted');
        setModalVisible(false);
        form.resetFields();
        fetchLeaveRequests();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create leave request');
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.put(`/leave/${id}/status`, { status });
      if (res.data.success) {
        message.success(res.data.message || `Leave ${status.toLowerCase()}`);
        fetchLeaveRequests();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'processing',
      Approved: 'success',
      Rejected: 'error',
      Cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const pendingRequests = useMemo(
    () => leaveRequests.filter((lr) => lr.status === 'Pending'),
    [leaveRequests]
  );
  const approvedThisMonth = leaveRequests.filter(
    (lr) => lr.status === 'Approved' && dayjs(lr.date_start).isSame(dayjs(), 'month')
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
      responsive: ['sm'],
    },
    {
      title: 'Start',
      dataIndex: 'date_start',
      key: 'date_start',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date_start).unix() - dayjs(b.date_start).unix(),
    },
    {
      title: 'End',
      dataIndex: 'date_end',
      key: 'date_end',
      responsive: ['md'],
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
      responsive: ['lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      render: (_, record) => (
        <Space wrap size="small">
          {record.status === 'Pending' && canManage && (
            <>
              <Popconfirm title="Approve this leave?" onConfirm={() => updateStatus(record.id, 'Approved')}>
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={updatingId === record.id}
                >
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm title="Reject this leave?" onConfirm={() => updateStatus(record.id, 'Rejected')}>
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  loading={updatingId === record.id}
                >
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'Pending' && !canManage && user?.employee_id === record.employee_id && (
            <Popconfirm title="Cancel this request?" onConfirm={() => updateStatus(record.id, 'Cancelled')}>
              <Button size="small">Cancel</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const tableProps = {
    columns,
    loading,
    rowKey: 'id',
    pagination: { pageSize: 10, responsive: true },
    scroll: { x: true },
  };

  return (
    <div className="page-leave">
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending" value={pendingRequests.length} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Approved (month)" value={approvedThisMonth} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Requests" value={leaveRequests.length} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card>
            <Statistic title="Leave Types" value={leaveTypes.length} />
          </Card>
        </Col>
      </Row>

      <Card
        title={(
          <span>
            <CalendarOutlined style={{ marginRight: 8 }} />
            Leave Management
          </span>
        )}
        extra={(
          <Space wrap>
            {canExport && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => authService.downloadPdf('/export/leave.pdf', 'leave-summary.pdf')}
              >
                Export PDF
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              New Request
            </Button>
          </Space>
        )}
      >
        <Tabs
          items={[
            {
              key: 'all',
              label: 'All',
              children: <Table {...tableProps} dataSource={leaveRequests} />,
            },
            {
              key: 'pending',
              label: `Pending (${pendingRequests.length})`,
              children: <Table {...tableProps} dataSource={pendingRequests} />,
            },
            {
              key: 'approved',
              label: 'Approved',
              children: (
                <Table
                  {...tableProps}
                  dataSource={leaveRequests.filter((lr) => lr.status === 'Approved')}
                />
              ),
            },
            {
              key: 'types',
              label: 'Leave Types',
              children: (
                <Table
                  columns={[
                    { title: 'Name', dataIndex: 'name', key: 'name' },
                    {
                      title: 'Default Quota',
                      dataIndex: 'default_quota',
                      key: 'quota',
                      render: (val) => `${val ?? '—'} days`,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => (
                        <Tag color={status === 'Active' ? 'success' : 'default'}>{status}</Tag>
                      ),
                    },
                  ]}
                  dataSource={leaveTypes}
                  rowKey="id"
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="New Leave Request"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} onFinish={handleAddLeaveRequest} layout="vertical">
          {canManage && (
            <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
              <Select placeholder="Select employee" showSearch optionFilterProp="children">
                {employees.map((emp) => (
                  <Option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="leave_type_id" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select leave type">
              {leaveTypes.filter((lt) => lt.status === 'Active').map((type) => (
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
