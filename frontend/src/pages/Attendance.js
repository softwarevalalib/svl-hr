import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Statistic, Row, Col, Upload, Alert,
} from 'antd';
import {
  PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, LoginOutlined, LogoutOutlined, FilePdfOutlined, UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';
import { api, authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

const Attendance = () => {
  const { hasPermission, user } = useAuth();
  const canManage = hasPermission(['attendance.manage']);
  const canSelf = hasPermission(['attendance.self', 'attendance.manage']);
  const canExport = hasPermission(['export.pdf', 'attendance.view', 'attendance.manage']);
  const canImport = hasPermission('import.data');

  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [today, setToday] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance');
      if (res.data.success) setAttendance(res.data.data);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchToday = useCallback(async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setToday(res.data.data);
        setSchedule(res.data.schedule);
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!canManage) return;
    try {
      const res = await employeeService.getAll();
      if (res.success) setEmployees(res.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, [canManage]);

  useEffect(() => {
    fetchAttendance();
    fetchToday();
    fetchEmployees();
  }, [fetchAttendance, fetchToday, fetchEmployees]);

  const clockIn = async () => {
    setClockLoading(true);
    try {
      const res = await api.post('/attendance/clock-in', {});
      message.success(res.data.message || 'Signed in');
      fetchToday();
      fetchAttendance();
    } catch (error) {
      message.error(error.response?.data?.message || 'Sign in failed');
    } finally {
      setClockLoading(false);
    }
  };

  const clockOut = async () => {
    setClockLoading(true);
    try {
      const res = await api.post('/attendance/clock-out', {});
      message.success(res.data.message || 'Signed out');
      fetchToday();
      fetchAttendance();
    } catch (error) {
      message.error(error.response?.data?.message || 'Sign out failed');
    } finally {
      setClockLoading(false);
    }
  };

  const handleAddAttendance = async (values) => {
    try {
      const res = await api.post('/attendance', {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        in_time: values.in_time ? values.in_time.format('HH:mm') : null,
        out_time: values.out_time ? values.out_time.format('HH:mm') : null,
      });
      if (res.data.success) {
        message.success('Attendance recorded successfully');
        setModalVisible(false);
        form.resetFields();
        fetchAttendance();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to record attendance');
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    if (status.includes('Late')) return 'warning';
    if (status.includes('Early')) return 'orange';
    if (status === 'Present') return 'success';
    if (status === 'Absent') return 'error';
    return 'default';
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return 'N/A';
    const checkIn = dayjs(`2000-01-01 ${inTime}`);
    const checkOut = dayjs(`2000-01-01 ${outTime}`);
    return `${checkOut.diff(checkIn, 'hour', true).toFixed(1)}h`;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    ...(canManage
      ? [{ title: 'Employee', dataIndex: 'employee_name', key: 'employee_name' }]
      : []),
    {
      title: 'Sign In',
      dataIndex: 'in_time',
      key: 'in_time',
      render: (time) => (time ? dayjs(`2000-01-01 ${time}`).format('hh:mm A') : '—'),
    },
    {
      title: 'Sign Out',
      dataIndex: 'out_time',
      key: 'out_time',
      render: (time) => (time ? dayjs(`2000-01-01 ${time}`).format('hh:mm A') : '—'),
    },
    {
      title: 'Hours',
      key: 'hours',
      render: (_, record) => calculateHours(record.in_time, record.out_time),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (status ? <Tag color={getStatusColor(status)}>{status}</Tag> : '—'),
    },
    { title: 'Note', dataIndex: 'note', key: 'note', ellipsis: true },
  ];

  const todayAttendance = attendance.filter((a) => dayjs(a.date).isSame(dayjs(), 'day'));
  const signedIn = today?.in_time && !today?.out_time;
  const signedOut = today?.in_time && today?.out_time;

  return (
    <div>
      {canSelf && (
        <Card className="attendance-clock-card" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <h2 style={{ margin: 0 }}>My Attendance</h2>
              <p style={{ margin: '8px 0 0', color: '#5c6b7a' }}>
                {user?.employee
                  ? `${user.employee.first_name} ${user.employee.last_name}`
                  : 'Link an employee profile to your user account to clock in.'}
              </p>
              {schedule && (
                <p style={{ margin: '4px 0 0', color: '#8a97a5', fontSize: 13 }}>
                  Schedule today: {schedule.is_workday ? `${schedule.sign_in_time} – ${schedule.sign_out_time}` : 'Non-work day'}
                  {schedule.grace_minutes != null ? ` · grace ${schedule.grace_minutes}m` : ''}
                </p>
              )}
            </Col>
            <Col xs={24} md={12} style={{ textAlign: 'right' }}>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<LoginOutlined />}
                  loading={clockLoading}
                  disabled={!user?.employee_id || !!today?.in_time}
                  onClick={clockIn}
                >
                  Sign In
                </Button>
                <Button
                  size="large"
                  icon={<LogoutOutlined />}
                  loading={clockLoading}
                  disabled={!signedIn}
                  onClick={clockOut}
                >
                  Sign Out
                </Button>
              </Space>
              {today && (
                <div style={{ marginTop: 12 }}>
                  <Tag color={getStatusColor(today.status)}>{today.status || 'In progress'}</Tag>
                  {today.in_time && <Tag>In {today.in_time}</Tag>}
                  {today.out_time && <Tag>Out {today.out_time}</Tag>}
                  {signedOut && <Tag color="blue">Completed</Tag>}
                </div>
              )}
            </Col>
          </Row>
          {!user?.employee_id && (
            <Alert
              style={{ marginTop: 16 }}
              type="warning"
              showIcon
              message="No employee linked"
              description="Ask an admin to link your user account to an employee record."
            />
          )}
        </Card>
      )}

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Today's Records" value={todayAttendance.length} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={todayAttendance.filter((a) => a.in_time).length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Records" value={attendance.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="This Month"
              value={attendance.filter((a) => dayjs(a.date).isSame(dayjs(), 'month')).length}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <ClockCircleOutlined style={{ marginRight: 8 }} />
            {canManage ? 'All Attendance Records' : 'My Attendance Records'}
          </span>
        }
        extra={
          <Space wrap>
            {canExport && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => authService.downloadPdf('/export/attendance.pdf', 'attendance-report.pdf')}
              >
                Export PDF
              </Button>
            )}
            {canImport && (
              <Upload
                accept=".csv"
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    const formData = new FormData();
                    formData.append('file', file);
                    await api.post('/export/import/attendance', formData);
                    message.success('Attendance imported');
                    fetchAttendance();
                    onSuccess();
                  } catch (e) {
                    message.error(e.response?.data?.message || 'Import failed');
                    onError(e);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>Import CSV</Button>
              </Upload>
            )}
            {canManage && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                Record Attendance
              </Button>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={attendance}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Record Attendance"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleAddAttendance} layout="vertical">
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee">
              {employees.map((emp) => (
                <Option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="in_time" label="Sign In Time">
            <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="out_time" label="Sign Out Time">
            <DatePicker.TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Attendance;
