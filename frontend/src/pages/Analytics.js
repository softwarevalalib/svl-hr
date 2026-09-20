import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, message } from 'antd';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../services/authService';

const COLORS = ['#1f6f8b', '#3d8b6e', '#c47a3a', '#5b6b8a', '#8b4d6b', '#4a7c59'];

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    monthlyAttendance: [],
    monthlyEmployees: [],
    leaveByType: [],
    expensesByMonth: [],
    departmentHeadcount: [],
  });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/overview');
      if (res.data.success) {
        setData({
          monthlyAttendance: res.data.data.monthlyAttendance || [],
          monthlyEmployees: res.data.data.monthlyEmployees || [],
          leaveByType: res.data.data.leaveByType || [],
          expensesByMonth: res.data.data.expensesByMonth || [],
          departmentHeadcount: res.data.data.departmentHeadcount || [],
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const monthlyTrend = useMemo(() => {
    const map = {};
    (data.monthlyAttendance || []).forEach((r) => {
      map[r.month] = { month: r.month, attendance: Number(r.attendance) || 0, employees: 0 };
    });
    (data.monthlyEmployees || []).forEach((r) => {
      if (!map[r.month]) map[r.month] = { month: r.month, attendance: 0, employees: 0 };
      map[r.month].employees = Number(r.employees) || 0;
    });
    return Object.values(map).sort((a, b) => String(a.month).localeCompare(String(b.month)));
  }, [data.monthlyAttendance, data.monthlyEmployees]);

  return (
    <div className="page-analytics">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Monthly Trends" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="employees" stroke="#1f6f8b" name="New hires" strokeWidth={2} />
                <Line type="monotone" dataKey="attendance" stroke="#3d8b6e" name="Attendance records" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Headcount by Department" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.departmentHeadcount}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1f6f8b" name="Employees" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Leave by Type" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.leaveByType}
                  dataKey="count"
                  nameKey="leave_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ leave_type, count }) => `${leave_type}: ${count}`}
                >
                  {(data.leaveByType || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Expenses by Month" loading={loading}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.expensesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#c47a3a" name="Total" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
