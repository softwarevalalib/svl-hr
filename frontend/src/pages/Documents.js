import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Upload, Tag, message, Space, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DownloadOutlined, DeleteOutlined, FileOutlined, UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

const CATEGORIES = ['General', 'Contract', 'ID', 'Certificate', 'Immigration', 'Other'];

const Documents = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('documents.manage');
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      if (res.data.success) setDocs(res.data.data || []);
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (canManage) {
      employeeService.getAll().then((r) => {
        if (r.success) setEmployees(r.data || []);
      }).catch(() => {});
    }
  }, [load, canManage]);

  const handleUpload = async (values) => {
    try {
      const fd = new FormData();
      fd.append('employee_id', values.employee_id);
      fd.append('name', values.name);
      fd.append('category', values.category || 'General');
      if (values.description) fd.append('description', values.description);
      if (fileList[0]?.originFileObj) {
        fd.append('file', fileList[0].originFileObj);
      }
      const res = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        message.success('Document uploaded');
        setModalVisible(false);
        form.resetFields();
        setFileList([]);
        load();
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Upload failed');
    }
  };

  const handleDownload = async (record) => {
    try {
      await authService.downloadFile(`/documents/${record.id}/download`, record.file_name || record.name);
    } catch (e) {
      message.error('Download failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      message.success('Deleted');
      load();
    } catch (e) {
      message.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Employee',
      dataIndex: 'employee_name',
      key: 'employee_name',
      responsive: ['sm'],
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (c) => <Tag>{c || 'General'}</Tag>,
    },
    {
      title: 'File',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      responsive: ['md'],
      render: (f) => f || '—',
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      responsive: ['lg'],
      render: (d) => (d ? dayjs(d).format('MMM DD, YYYY') : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
            Download
          </Button>
          {canManage && (
            <Popconfirm title="Delete this document?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-documents">
      <Card
        title={(
          <span>
            <FileOutlined style={{ marginRight: 8 }} />
            Employee Documents
          </span>
        )}
        extra={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              Upload
            </Button>
          ) : null
        }
      >
        <Table
          columns={columns}
          dataSource={docs}
          loading={loading}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{ pageSize: 10, responsive: true }}
        />
      </Card>

      <Modal
        title="Upload Document"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="employee_id" label="Employee" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select employee">
              {employees.map((e) => (
                <Option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="Document Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Employment Contract" />
          </Form.Item>
          <Form.Item name="category" label="Category" initialValue="General">
            <Select>
              {CATEGORIES.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="File">
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select file</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Documents;
