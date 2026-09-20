import React, { useState } from 'react';
import { Card, Row, Col, Button, Select, DatePicker, Table, Space, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, PrinterOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports = () => {
  const [reportType, setReportType] = useState('employees');
  const [loading] = useState(false);

  const reportTypes = [
    { value: 'employees', label: 'Employee Report' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'leave', label: 'Leave Report' },
    { value: 'payroll', label: 'Payroll Report' },
    { value: 'expenses', label: 'Expenses Report' },
    { value: 'training', label: 'Training Report' },
  ];

  const handleExport = (format) => {
    message.info(`Exporting ${reportType} report as ${format}...`);
    // Implementation would export data
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div>
      <Card title="Generate Reports" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Select Report Type"
              value={reportType}
              onChange={setReportType}
            >
              {reportTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={() => handleExport('Excel')}
              >
                Excel
              </Button>
              <Button 
                icon={<FilePdfOutlined />}
                onClick={() => handleExport('PDF')}
              >
                PDF
              </Button>
              <Button 
                icon={<PrinterOutlined />}
                onClick={() => handleExport('Print')}
              >
                Print
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Report Preview">
        <Table
          columns={columns}
          dataSource={[]}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Reports;
