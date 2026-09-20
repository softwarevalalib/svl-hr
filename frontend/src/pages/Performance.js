import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Tag, message, Space, Statistic, Row, Col, Rate } from 'antd';
import { PlusOutlined, TrophyOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeService } from '../services/employeeService';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Performance = () => {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch from PerformanceReviews table - placeholder implementation
      // In production, this would call /api/performance/reviews
      setReviews([]);
    } catch (error) {
      message.error('Failed to load performance reviews');
    } finally {
      setLoading(false);
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
    fetchReviews();
    fetchEmployees();
  }, [fetchReviews, fetchEmployees]);

  const handleAddReview = async (values) => {
    try {
      // Placeholder - in production this would call the API
      message.success('Performance review created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchReviews();
    } catch (error) {
      message.error('Failed to create performance review');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'default',
      'Submitted': 'processing',
      'Completed': 'success'
    };
    return colors[status] || 'default';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  const completedReviews = reviews.filter(r => r.status === 'Completed').length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Review Period',
      key: 'period',
      render: (_, record) => 
        `${dayjs(record.review_period_start).format('MMM DD')} - ${dayjs(record.review_period_end).format('MMM DD, YYYY')}`,
    },
    {
      title: 'Rating',
      dataIndex: 'overall_rating',
      key: 'rating',
      render: (rating) => rating ? (
        <Tag color={getRatingColor(rating)}>
          <StarOutlined /> {rating}/5
        </Tag>
      ) : '-',
      sorter: (a, b) => (a.overall_rating || 0) - (b.overall_rating || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Review Date',
      dataIndex: 'review_date',
      key: 'review_date',
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => message.info('View review details')}>View</Button>
          {record.status === 'Draft' && (
            <Button size="small" type="primary" onClick={() => message.info('Edit review')}>Edit</Button>
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
            <Statistic title="Total Reviews" value={reviews.length} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Completed" value={completedReviews} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Average Rating" value={averageRating} suffix="/ 5.0" prefix={<StarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Pending Reviews" value={reviews.filter(r => r.status === 'Draft' || r.status === 'Submitted').length} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <TrophyOutlined style={{ marginRight: 8 }} />
            Performance Reviews
          </span>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            New Performance Review
          </Button>
        }
      >
        {reviews.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <TrophyOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <p style={{ color: '#999' }}>No performance reviews yet. Create your first review to get started.</p>
            </div>
          </Card>
        ) : (
          <Table
            columns={columns}
            dataSource={reviews}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="New Performance Review"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleAddReview} layout="vertical">
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select employee">
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_id})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="review_period" label="Review Period" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="review_date" label="Review Date">
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="overall_rating" label="Overall Rating">
            <Rate allowHalf />
          </Form.Item>
          <Form.Item name="goals" label="Goals">
            <TextArea rows={3} placeholder="Enter performance goals" />
          </Form.Item>
          <Form.Item name="achievements" label="Achievements">
            <TextArea rows={3} placeholder="Enter key achievements" />
          </Form.Item>
          <Form.Item name="areas_for_improvement" label="Areas for Improvement">
            <TextArea rows={3} placeholder="Enter areas that need improvement" />
          </Form.Item>
          <Form.Item name="comments" label="Comments">
            <TextArea rows={4} placeholder="Enter additional comments" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Performance;
