import React, { useEffect, useState } from 'react';
import { Card, Table, Switch, TimePicker, InputNumber, Button, message, Space } from 'antd';
import { ScheduleOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/authService';

const WorkSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/work-schedule');
      if (res.data.success) setSchedules(res.data.data);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (day_of_week, patch) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === day_of_week ? { ...s, ...patch } : s))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/settings/work-schedule', {
        schedules: schedules.map((s) => ({
          day_of_week: s.day_of_week,
          is_workday: s.is_workday ? 1 : 0,
          sign_in_time: s.sign_in_time,
          sign_out_time: s.sign_out_time,
          grace_minutes: s.grace_minutes,
        })),
      });
      message.success('Work schedule saved');
      load();
    } catch (err) {
      message.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { title: 'Day', dataIndex: 'day_name', key: 'day_name' },
    {
      title: 'Work Day',
      dataIndex: 'is_workday',
      key: 'is_workday',
      render: (v, record) => (
        <Switch
          checked={!!v}
          onChange={(checked) => updateRow(record.day_of_week, { is_workday: checked ? 1 : 0 })}
        />
      ),
    },
    {
      title: 'Sign In',
      dataIndex: 'sign_in_time',
      key: 'sign_in_time',
      render: (v, record) => (
        <TimePicker
          format="HH:mm"
          value={v ? dayjs(v, 'HH:mm') : null}
          onChange={(_, str) => updateRow(record.day_of_week, { sign_in_time: str })}
        />
      ),
    },
    {
      title: 'Sign Out',
      dataIndex: 'sign_out_time',
      key: 'sign_out_time',
      render: (v, record) => (
        <TimePicker
          format="HH:mm"
          value={v ? dayjs(v, 'HH:mm') : null}
          onChange={(_, str) => updateRow(record.day_of_week, { sign_out_time: str })}
        />
      ),
    },
    {
      title: 'Grace (min)',
      dataIndex: 'grace_minutes',
      key: 'grace_minutes',
      render: (v, record) => (
        <InputNumber
          min={0}
          max={120}
          value={v}
          onChange={(val) => updateRow(record.day_of_week, { grace_minutes: val })}
        />
      ),
    },
  ];

  return (
    <Card
      title={<span><ScheduleOutlined style={{ marginRight: 8 }} />Work Schedule</span>}
      extra={
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
          Save Schedule
        </Button>
      }
    >
      <p style={{ color: '#666', marginBottom: 16 }}>
        Set sign-in and sign-out times for each day. Attendance status (Late / Early Leave) is calculated from these settings.
      </p>
      <Table
        rowKey="day_of_week"
        loading={loading}
        columns={columns}
        dataSource={schedules}
        pagination={false}
      />
      <Space style={{ marginTop: 16 }}>
        <Button onClick={load}>Reset</Button>
      </Space>
    </Card>
  );
};

export default WorkSchedule;
