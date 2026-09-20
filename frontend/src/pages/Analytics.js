import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Analytics = () => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Sample analytics data - in production, fetch from API
      setAnalyticsData({
        monthlyTrend: [
          { month: 'Jan', employees: 45, attendance: 1200 },
          { month: 'Feb', employees: 52, attendance: 1320 },
          { month: 'Mar', employees: 48, attendance: 1280 },
          { month: 'Apr', employees: 55, attendance: 1400 },
        ],
        departmentPerformance: [
          { department: 'HR', score: 85 },
          { department: 'IT', score: 92 },
          { department: 'Finance', score: 78 },
          { department: 'Sales', score: 88 },
        ]
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="HR Analytics Dashboard" style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Select defaultValue="last6months" style={{ width: '100%' }}>
              <Option value="lastmonth">Last Month</Option>
              <Option value="last3months">Last 3 Months</Option>
              <Option value="last6months">Last 6 Months</Option>
              <Option value="lastyear">Last Year</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <RangePicker style={{ width: '100%' }} />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Monthly Trends" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="employees" stroke="#8884d8" name="Employees" />
                <Line type="monotone" dataKey="attendance" stroke="#82ca9d" name="Attendance" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Department Performance" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.departmentPerformance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
