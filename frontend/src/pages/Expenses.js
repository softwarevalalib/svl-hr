import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, message } from 'antd';
import { PlusOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

const Expenses = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('export.pdf');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
    fetchPaymentMethods();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setExpenses(response.data.data || []);
      }
    } catch (error) {
      message.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPaymentMethods(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods');
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/expenses', values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Expense submitted successfully');
      setModalVisible(false);
      fetchExpenses();
    } catch (error) {
      message.error('Failed to submit expense');
    }
  };

  const columns = [
    { title: 'Employee', dataIndex: 'employee_name', key: 'employee_name' },
    { title: 'Date', dataIndex: 'expense_date', key: 'expense_date' },
    { title: 'Category', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val, record) => `${record.currency || 'USD'} ${val}` },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    ...(canExport
      ? [{
          title: 'Export',
          key: 'export',
          render: (_, record) => (
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => authService.downloadPdf(`/export/expense/${record.id}.pdf`, `receipt-${record.id}.pdf`)}
            >
              PDF
            </Button>
          ),
        }]
      : []),
  ];

  return (
    <div>
      <Card
        title="Employee Expenses"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Expense
          </Button>
        }
      >
        <Table
          dataSource={expenses}
          columns={columns}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title="Add Expense"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="expense_date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="payment_method_id" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              {paymentMethods.map(method => (
                <Option key={method.id} value={method.id}>{method.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payee" label="Payee">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Expenses;
