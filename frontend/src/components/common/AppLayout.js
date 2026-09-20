import React, { useMemo, useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Drawer, Tag } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  ProjectOutlined,
  DollarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  AccountBookOutlined,
  ShoppingOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, primaryRole, permissions } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [location.pathname, isMobile]);

  const menuItems = useMemo(() => {
    const item = (key, icon, label, perm) => {
      if (perm && !hasPermission(perm)) return null;
      return { key, icon, label };
    };

    const groups = [
      {
        type: 'group',
        label: collapsed ? '' : 'Overview',
        children: [
          item('/dashboard', <DashboardOutlined />, 'Dashboard', 'dashboard.view'),
        ].filter(Boolean),
      },
      {
        type: 'group',
        label: collapsed ? '' : 'People',
        children: [
          item('/employees', <TeamOutlined />, 'Employees', ['employees.view', 'employees.manage']),
          item('/attendance', <ClockCircleOutlined />, 'Attendance', ['attendance.view', 'attendance.manage', 'attendance.self']),
          item('/leave', <CalendarOutlined />, 'Leave', ['leave.view', 'leave.manage', 'leave.self']),
          item('/training', <BookOutlined />, 'Training', ['training.view', 'training.manage']),
          item('/performance', <TrophyOutlined />, 'Performance', ['performance.view', 'performance.manage']),
        ].filter(Boolean),
      },
      {
        type: 'group',
        label: collapsed ? '' : 'Work',
        children: [
          item('/projects', <ProjectOutlined />, 'Projects', ['projects.view', 'projects.manage']),
          item('/expenses', <DollarOutlined />, 'Expenses', ['expenses.view', 'expenses.manage', 'expenses.self']),
        ].filter(Boolean),
      },
      {
        type: 'group',
        label: collapsed ? '' : 'Money',
        children: [
          item('/payroll', <CreditCardOutlined />, 'Payroll', ['payroll.view', 'payroll.manage']),
          item('/finance', <AccountBookOutlined />, 'Finance', ['finance.view', 'finance.manage']),
          item('/procurement', <ShoppingOutlined />, 'Procurement', ['procurement.view', 'procurement.manage']),
        ].filter(Boolean),
      },
      {
        type: 'group',
        label: collapsed ? '' : 'Insights',
        children: [
          item('/reports', <FileTextOutlined />, 'Reports', 'reports.view'),
          item('/analytics', <BarChartOutlined />, 'Analytics', 'analytics.view'),
        ].filter(Boolean),
      },
      {
        type: 'group',
        label: collapsed ? '' : 'Admin',
        children: [
          item('/users', <UsergroupAddOutlined />, 'Users', 'users.manage'),
          item('/roles', <SafetyCertificateOutlined />, 'Roles', 'roles.manage'),
          item('/settings/work-schedule', <ScheduleOutlined />, 'Work Schedule', 'settings.manage'),
        ].filter(Boolean),
      },
    ];

    return groups.filter((g) => g.children && g.children.length > 0);
  }, [hasPermission, collapsed, permissions]);

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'role',
      label: (
        <span>
          Role: <Tag color="geekblue">{primaryRole}</Tag>
        </span>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const siderContent = (
    <>
      <div className="app-sider-brand">
        <span className="app-sider-brand-mark">{collapsed && !isMobile ? 'SVL' : 'SVL HRM'}</span>
      </div>
      <Menu
        className="app-sider-menu"
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        inlineCollapsed={collapsed && !isMobile}
      />
    </>
  );

  return (
    <Layout className="app-shell">
      {!isMobile && (
        <Sider
          className="app-sider"
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          collapsedWidth={72}
        >
          {siderContent}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          bodyStyle={{ padding: 0, background: '#0f1c2e' }}
          headerStyle={{ display: 'none' }}
        >
          <div className="app-sider app-sider-drawer">{siderContent}</div>
        </Drawer>
      )}

      <Layout>
        <Header className="app-header">
          <button
            type="button"
            className="app-sider-toggle"
            aria-label="Toggle navigation"
            onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed))}
          >
            {collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <div className="app-header-right">
            <Tag className="app-role-chip">{primaryRole}</Tag>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <button type="button" className="app-user-chip">
                <Avatar size="small" icon={<UserOutlined />} />
                <span className="app-user-name">{user?.username || 'User'}</span>
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
