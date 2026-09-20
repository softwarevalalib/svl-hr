import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Select, Modal, Form, message, Tag, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilePdfOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { api, authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

const Employees = () => {
  const { hasPermission } = useAuth();
  const canExport = hasPermission(['export.pdf', 'employees.view']);
  const canImport = hasPermission('import.data');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadEmployees();
  }, [searchTerm, statusFilter]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const response = await employeeService.getAll(params);
      setEmployees(response.data || []);
    } catch (error) {
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingEmployee(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this employee?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await employeeService.delete(id);
          message.success('Employee deleted successfully');
          loadEmployees();
        } catch (error) {
          message.error('Failed to delete employee');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee.id, values);
        message.success('Employee updated successfully');
      } else {
        await employeeService.create(values);
        message.success('Employee created successfully');
      }
      setIsModalVisible(false);
      loadEmployees();
    } catch (error) {
      message.error('Failed to save employee');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'employee_id',
      key: 'employee_id',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Department',
      dataIndex: 'department_name',
      key: 'department',
    },
    {
      title: 'Job Title',
      dataIndex: 'job_title',
      key: 'job_title',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Active' ? 'green' : status === 'Inactive' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/employees/${record.id}`)}>
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Employees</h1>
        <Space wrap>
          {canExport && (
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => authService.downloadPdf('/export/employees.pdf', 'employees.pdf')}
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
                  await api.post('/export/import/employees', formData);
                  message.success('Employees imported');
                  loadEmployees();
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Employee
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input
          placeholder="Search employees..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
        <Select
          placeholder="Filter by status"
          style={{ width: 200 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Option value="Active">Active</Option>
          <Option value="Inactive">Inactive</Option>
          <Option value="Terminated">Terminated</Option>
        </Select>
      </div>

      <Table 
        columns={columns} 
        dataSource={employees} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingEmployee ? 'Edit Employee' : 'Add Employee'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="first_name" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input />
          </Form.Item>
          <Form.Item name="job_title" label="Job Title">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Terminated">Terminated</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingEmployee ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Employees;

