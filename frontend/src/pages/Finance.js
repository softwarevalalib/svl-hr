import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Tabs, Tag, message, Statistic, Row, Col, Space } from 'antd';
import { PlusOutlined, DollarOutlined, AccountBookOutlined, TransactionOutlined, FilePdfOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { TabPane } = Tabs;
const { Option } = Select;

const Finance = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission('export.pdf');
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [accountForm] = Form.useForm();
  const [transactionForm] = Form.useForm();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await axios.get('/api/finance/accounts', { headers });
      if (res.data.success) setAccounts(res.data.data);
    } catch (error) {
      message.error('Failed to load accounts');
    }
  }, [headers]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/finance/transactions', { headers });
      if (res.data.success) setTransactions(res.data.data);
    } catch (error) {
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await axios.get('/api/finance/budgets', { headers });
      if (res.data.success) setBudgets(res.data.data);
    } catch (error) {
      message.error('Failed to load budgets');
    }
  }, [headers]);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchBudgets();
  }, [fetchAccounts, fetchTransactions, fetchBudgets]);



  const handleAddAccount = async (values) => {
    try {
      const res = await axios.post('/api/finance/accounts', values, { headers });
      if (res.data.success) {
        message.success('Account created successfully');
        setAccountModalVisible(false);
        accountForm.resetFields();
        fetchAccounts();
      }
    } catch (error) {
      message.error('Failed to create account');
    }
  };

  const handleAddTransaction = async (values) => {
    try {
      const res = await axios.post('/api/finance/transactions', {
        ...values,
        transaction_date: values.transaction_date.format('YYYY-MM-DD')
      }, { headers });
      if (res.data.success) {
        message.success('Transaction recorded successfully');
        setTransactionModalVisible(false);
        transactionForm.resetFields();
        fetchTransactions();
        fetchAccounts();
      }
    } catch (error) {
      message.error('Failed to record transaction');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Accounts" value={accounts.length} prefix={<AccountBookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Balance" value={totalBalance} prefix="$" precision={2} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Transactions" value={transactions.length} prefix={<TransactionOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Active Budgets" value={budgets.filter(b => b.status === 'Active').length} />
          </Card>
        </Col>
      </Row>

      <Card 
        title={<span><DollarOutlined style={{ marginRight: 8 }} />Finance Management</span>}
      >
        <Tabs defaultActiveKey="accounts">
          <TabPane tab="Accounts" key="accounts">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAccountModalVisible(true)} style={{ marginBottom: 16 }}>
              Add Account
            </Button>
            <Table
              columns={[
                { title: 'Account Number', dataIndex: 'account_number', key: 'account_number' },
                { title: 'Account Name', dataIndex: 'account_name', key: 'account_name' },
                { title: 'Type', dataIndex: 'account_type_name', key: 'type' },
                { title: 'Balance', dataIndex: 'current_balance', key: 'balance', render: (val) => `$${val || 0}` },
                { title: 'Currency', dataIndex: 'currency', key: 'currency' },
                { title: 'Status', dataIndex: 'is_active', key: 'status', render: (val) => 
                  <Tag color={val ? 'success' : 'default'}>{val ? 'Active' : 'Inactive'}</Tag>
                }
              ]}
              dataSource={accounts}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Transactions" key="transactions">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setTransactionModalVisible(true)} style={{ marginBottom: 16 }}>
              New Transaction
            </Button>
            <Table
              columns={[
                { title: 'Transaction #', dataIndex: 'transaction_number', key: 'transaction_number' },
                { title: 'Account', dataIndex: 'account_name', key: 'account' },
                { title: 'Type', dataIndex: 'transaction_type_name', key: 'type' },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => `$${val || 0}` },
                { title: 'Date', dataIndex: 'transaction_date', key: 'date', render: (date) => dayjs(date).format('MMM DD, YYYY') },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={status === 'Completed' ? 'success' : 'default'}>{status}</Tag>
                },
                ...(canExport ? [{
                  title: 'Invoice',
                  key: 'pdf',
                  render: (_, record) => (
                    <Button
                      size="small"
                      icon={<FilePdfOutlined />}
                      onClick={() => authService.downloadPdf(`/export/invoice/${record.id}.pdf`, `invoice-${record.id}.pdf`)}
                    >
                      PDF
                    </Button>
                  ),
                }] : []),
              ]}
              dataSource={transactions}
              loading={loading}
              rowKey="id"
            />
          </TabPane>
          <TabPane tab="Budgets" key="budgets">
            <Table
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Category', dataIndex: 'category_name', key: 'category' },
                { title: 'Allocated', dataIndex: 'allocated_amount', key: 'allocated', render: (val) => `$${val || 0}` },
                { title: 'Spent', dataIndex: 'spent_amount', key: 'spent', render: (val) => `$${val || 0}` },
                { title: 'Remaining', key: 'remaining', render: (_, record) => 
                  `$${(record.allocated_amount || 0) - (record.spent_amount || 0)}`
                },
                { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => 
                  <Tag color={status === 'Active' ? 'success' : 'default'}>{status}</Tag>
                }
              ]}
              dataSource={budgets}
              rowKey="id"
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title="Add Account" open={accountModalVisible} onCancel={() => setAccountModalVisible(false)} onOk={() => accountForm.submit()}>
        <Form form={accountForm} onFinish={handleAddAccount} layout="vertical">
          <Form.Item name="account_number" label="Account Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="account_name" label="Account Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="opening_balance" label="Opening Balance">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bank_name" label="Bank Name">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="New Transaction" open={transactionModalVisible} onCancel={() => setTransactionModalVisible(false)} onOk={() => transactionForm.submit()}>
        <Form form={transactionForm} onFinish={handleAddTransaction} layout="vertical">
          <Form.Item name="account_id" label="Account" rules={[{ required: true }]}>
            <Select>
              {accounts.map(acc => <Option key={acc.id} value={acc.id}>{acc.account_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="transaction_date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Finance;
