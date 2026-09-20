import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Select, DatePicker, Table, Space, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api, authService } from '../services/authService';

const { RangePicker } = DatePicker;
const { Option } = Select;

const reportTypes = [
  { value: 'employees', label: 'Employee Report' },
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'leave', label: 'Leave Report' },
  { value: 'payroll', label: 'Payroll Report' },
  { value: 'expenses', label: 'Expenses Report' },
  { value: 'training', label: 'Training Report' },
];

const Reports = () => {
  const [reportType, setReportType] = useState('employees');
  const [range, setRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);

  const buildParams = useCallback(() => {
    const params = { type: reportType };
    if (range?.[0]) params.from = range[0].format('YYYY-MM-DD');
    if (range?.[1]) params.to = range[1].format('YYYY-MM-DD');
    return params;
  }, [reportType, range]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/preview', { params: buildParams() });
      if (res.data.success) {
        const data = res.data.data || [];
        setRows(data.map((r, i) => ({ ...r, key: r.id ?? i })));
        if (data.length) {
          setColumns(
            Object.keys(data[0]).map((k) => ({
              title: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              dataIndex: k,
              key: k,
              ellipsis: true,
              render: (v) => {
                if (v == null) return '—';
                if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
                  return dayjs(v).isValid() ? dayjs(v).format('MMM DD, YYYY') : v;
                }
                return String(v);
              },
            }))
          );
        } else {
          setColumns([{ title: 'Message', dataIndex: 'info', key: 'info' }]);
          setRows([{ key: 0, info: 'No data for this report' }]);
        }
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const qs = () => {
    const p = buildParams();
    const q = new URLSearchParams();
    if (p.from) q.set('from', p.from);
    if (p.to) q.set('to', p.to);
    const s = q.toString();
    return s ? `?${s}` : '';
  };

  const handleExport = async (format) => {
    try {
      const path =
        format === 'Excel'
          ? `/reports/${reportType}.xlsx${qs()}`
          : `/reports/${reportType}.pdf${qs()}`;
      const filename = `${reportType}-report.${format === 'Excel' ? 'xlsx' : 'pdf'}`;
      await authService.downloadFile(path, filename);
      message.success(`${format} export started`);
    } catch (e) {
      message.error(`Export failed: ${e.message || 'error'}`);
    }
  };

  return (
    <div className="page-reports">
      <Card title="Generate Reports" className="reports-controls" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              value={reportType}
              onChange={setReportType}
            >
              {reportTypes.map((type) => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={range}
              onChange={setRange}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={loadPreview}>
                Preview
              </Button>
              <Button type="primary" icon={<FileExcelOutlined />} onClick={() => handleExport('Excel')}>
                Excel
              </Button>
              <Button icon={<FilePdfOutlined />} onClick={() => handleExport('PDF')}>
                PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Report Preview">
        <Table
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={{ pageSize: 10, responsive: true }}
          scroll={{ x: true }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Reports;
