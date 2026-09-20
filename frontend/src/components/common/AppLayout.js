import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Avatar, Dropdown, Drawer, Tag, Badge, Button, Empty, message } from 'antd';
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
  PictureOutlined,
  FolderOutlined,
  BellOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { api } from '../../services/authService';

const { Header, Sider, Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, primaryRole } = useAuth();
  const { company_name, logoUrl } = useBranding();

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

  const loadNotifications = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count'),
      ]);
      if (listRes.data.success) setNotifications(listRes.data.data || []);
      if (countRes.data.success) setUnreadCount(countRes.data.count || 0);
    } catch (e) {
      /* table may not exist yet */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 60000);
    return () => clearInterval(t);
  }, [loadNotifications]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (e) {
      message.error('Could not update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      loadNotifications();
    } catch (e) {
      message.error('Could not update notifications');
    }
  };

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
          item('/documents', <FolderOutlined />, 'Documents', ['documents.view', 'documents.manage', 'employees.view']),
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
          item('/settings/branding', <PictureOutlined />, 'Branding', 'settings.manage'),
        ].filter(Boolean),
      },
    ];

    return groups.filter((g) => g.children && g.children.length > 0);
  }, [hasPermission, collapsed]);

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

  const notifMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      ...(notifications.length
        ? notifications.slice(0, 12).map((n) => ({
            key: String(n.id),
            label: (
              <div
                className={`notif-item ${n.status === 'Unread' ? 'notif-unread' : ''}`}
                onClick={() => {
                  if (n.status === 'Unread') markRead(n.id);
                  if (n.link) navigate(n.link);
                  setNotifOpen(false);
                }}
              >
                <div className="notif-title">{n.title}</div>
                {n.message && <div className="notif-msg">{n.message}</div>}
              </div>
            ),
          }))
        : [
            {
              key: 'empty',
              label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />,
              disabled: true,
            },
          ]),
    ],
  };

  const siderContent = (
    <>
      <div className="app-sider-brand">
        <img src={logoUrl} alt={company_name} className="app-sider-logo" />
        {(!collapsed || isMobile) && (
          <span className="app-sider-brand-mark">{company_name}</span>
        )}
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
          width={Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 40 : 280)}
          styles={{ body: { padding: 0, background: '#0f1c2e' }, header: { display: 'none' } }}
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
            <Dropdown
              menu={notifMenu}
              trigger={['click']}
              open={notifOpen}
              onOpenChange={setNotifOpen}
              placement="bottomRight"
              overlayClassName="notif-dropdown"
            >
              <button type="button" className="app-notif-btn" aria-label="Notifications">
                <Badge count={unreadCount} size="small" overflowCount={99}>
                  <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
              </button>
            </Dropdown>
            {!isMobile && <Tag className="app-role-chip">{primaryRole}</Tag>}
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
