import React, { useEffect, useState, useCallback } from 'react';
import {
  Row, Col, Card, Statistic, Spin, Empty, List, Tag, Progress, Button, Space
} from 'antd';
import {
  UserOutlined, TeamOutlined,
  CalendarOutlined, DollarOutlined,
  BookOutlined, ProjectOutlined, ClockCircleOutlined,
  AlertOutlined, LoginOutlined, LogoutOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard = () => {
  const { user, hasPermission, primaryRole } = useAuth();
  const navigate = useNavigate();
  const isOrgDashboard = hasPermission(['employees.view', 'employees.manage', 'analytics.view']);

  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      if (isOrgDashboard) {
        const [statsRes, distRes, trendsRes, leavesRes, activitiesRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/employee-distribution'),
          api.get('/dashboard/attendance-trends'),
          api.get('/dashboard/leave-distribution'),
          api.get('/dashboard/recent-activities'),
        ]);
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (distRes.data.success) setDistribution(distRes.data.data);
        if (trendsRes.data.success) setAttendanceTrends(trendsRes.data.data);
        if (leavesRes.data.success) setLeaveDistribution(leavesRes.data.data);
        if (activitiesRes.data.success) setRecentActivities(activitiesRes.data.data);
      }

      if (hasPermission(['attendance.self', 'attendance.manage'])) {
        const [todayRes, myRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/attendance/my'),
        ]);
        if (todayRes.data.success) setTodayAttendance(todayRes.data.data);
        if (myRes.data.success) setMyAttendance((myRes.data.data || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isOrgDashboard, hasPermission]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const clockIn = async () => {
    setClockLoading(true);
    try {
      await api.post('/attendance/clock-in', {});
      await loadDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setClockLoading(false);
    }
  };

  const clockOut = async () => {
    setClockLoading(true);
    try {
      await api.post('/attendance/clock-out', {});
      await loadDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setClockLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      employee: <UserOutlined style={{ color: '#1890ff' }} />,
      leave: <CalendarOutlined style={{ color: '#52c41a' }} />,
      expense: <DollarOutlined style={{ color: '#faad14' }} />,
      training: <BookOutlined style={{ color: '#722ed1' }} />
    };
    return icons[type] || <AlertOutlined />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'green',
      'Pending': 'orange',
      'Approved': 'blue',
      'Rejected': 'red',
      'Inactive': 'default'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading dashboard...</p>
      </div>
    );
  }

  const employeeData = distribution || [];
  const attendanceData = attendanceTrends.map(item => ({
    date: dayjs(item.date).format('MMM DD'),
    count: item.count
  }));

  const personalClock = hasPermission(['attendance.self', 'attendance.manage']) && (
    <Card style={{ marginBottom: 24 }} className="attendance-clock-card">
      <Row gutter={16} align="middle">
        <Col xs={24} md={14}>
          <h2 style={{ margin: 0 }}>Welcome, {user?.username}</h2>
          <p style={{ margin: '6px 0 0', color: '#5c6b7a' }}>
            {primaryRole}
            {user?.employee ? ` · ${user.employee.first_name} ${user.employee.last_name}` : ''}
          </p>
          <div style={{ marginTop: 12 }}>
            {todayAttendance?.in_time ? (
              <Space>
                <Tag color="green">Signed in {todayAttendance.in_time}</Tag>
                {todayAttendance.out_time ? (
                  <Tag>Signed out {todayAttendance.out_time}</Tag>
                ) : (
                  <Tag color="processing">On shift</Tag>
                )}
                {todayAttendance.status && <Tag>{todayAttendance.status}</Tag>}
              </Space>
            ) : (
              <Tag>Not signed in yet today</Tag>
            )}
          </div>
        </Col>
        <Col xs={24} md={10} style={{ textAlign: 'right' }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              loading={clockLoading}
              disabled={!user?.employee_id || !!todayAttendance?.in_time}
              onClick={clockIn}
            >
              Sign In
            </Button>
            <Button
              icon={<LogoutOutlined />}
              loading={clockLoading}
              disabled={!todayAttendance?.in_time || !!todayAttendance?.out_time}
              onClick={clockOut}
            >
              Sign Out
            </Button>
            <Button onClick={() => navigate('/attendance')}>View records</Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  if (!isOrgDashboard) {
    return (
      <div style={{ padding: '0 8px' }}>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>My Dashboard</h1>
        {personalClock}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Recent attendance">
              <List
                dataSource={myAttendance}
                locale={{ emptyText: <Empty description="No attendance yet" /> }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={dayjs(item.date).format('MMM DD, YYYY')}
                      description={`${item.in_time || '—'} → ${item.out_time || '—'}`}
                    />
                    <Tag>{item.status || '—'}</Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Quick links">
              <Space direction="vertical" style={{ width: '100%' }}>
                {hasPermission(['leave.self', 'leave.view']) && (
                  <Button block onClick={() => navigate('/leave')}>Leave</Button>
                )}
                {hasPermission(['expenses.self', 'expenses.view']) && (
                  <Button block onClick={() => navigate('/expenses')}>Expenses</Button>
                )}
                {hasPermission(['attendance.self', 'attendance.view']) && (
                  <Button block onClick={() => navigate('/attendance')}>Attendance</Button>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>Dashboard</h1>
        <Tag color="blue" style={{ padding: '4px 12px', fontSize: '14px' }}>
          Last updated: {dayjs().format('HH:mm:ss')}
        </Tag>
      </div>

      {personalClock}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Total Employees"
              value={stats?.employees?.total || 0}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="success">{stats?.employees?.active || 0} Active</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Departments"
              value={stats?.departments?.total || 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: '24px' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Pending Leaves"
              value={stats?.leaves?.total || 0}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: '24px' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Active Projects"
              value={stats?.projects?.total || 0}
              prefix={<ProjectOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Attendance (Last 7 Days)"
              value={stats?.attendance?.total || 0}
              prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Active Training"
              value={stats?.training?.total || 0}
              prefix={<BookOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Pending Expenses"
              value={stats?.expenses?.total || 0}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
            {stats?.expenses?.total_amount && (
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                Total: ${parseFloat(stats.expenses.total_amount).toFixed(2)}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Total Users"
              value={stats?.users?.total || 0}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Employee Distribution by Department"
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {employeeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Leave Request Status"
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {leaveDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {leaveDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No leave data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Attendance Trends and Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Attendance Trends (Last 7 Days)"
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#1890ff"
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No attendance data available" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Recent Activities"
            style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {recentActivities.length > 0 ? (
              <List
                dataSource={recentActivities}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={getActivityIcon(item.type)}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{item.title}</span>
                          <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
                        </div>
                      }
                      description={dayjs(item.date).format('MMM DD, YYYY')}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No recent activities" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Employee Status Progress */}
      {stats?.employees && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card
              title="Employee Status Overview"
              style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Active</span>
                      <span>{stats.employees.active || 0}</span>
                    </div>
                    <Progress
                      percent={((stats.employees.active || 0) / (stats.employees.total || 1)) * 100}
                      strokeColor="#52c41a"
                      showInfo={false}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Inactive</span>
                      <span>{stats.employees.inactive || 0}</span>
                    </div>
                    <Progress
                      percent={((stats.employees.inactive || 0) / (stats.employees.total || 1)) * 100}
                      strokeColor="#faad14"
                      showInfo={false}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Terminated</span>
                      <span>{stats.employees.terminated || 0}</span>
                    </div>
                    <Progress
                      percent={((stats.employees.terminated || 0) / (stats.employees.total || 1)) * 100}
                      strokeColor="#f5222d"
                      showInfo={false}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;

