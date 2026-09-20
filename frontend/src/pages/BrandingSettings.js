import React, { useCallback, useEffect, useState } from 'react';
import { Card, Form, Input, Button, Upload, message, Space, Image, Row, Col, Divider } from 'antd';
import { SaveOutlined, UploadOutlined, PictureOutlined, ClearOutlined } from '@ant-design/icons';
import { api } from '../services/authService';
import { useBranding } from '../context/BrandingContext';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const BrandingSettings = () => {
  const { refreshBranding, setBrandingFromSave, company_name } = useBranding();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState('/branding/svl-logo-default.png');
  const [bgPreview, setBgPreview] = useState('/branding/login-bg-default.jpg');
  const [logoData, setLogoData] = useState(undefined);
  const [bgData, setBgData] = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/branding');
      if (res.data.success) {
        const d = res.data.data;
        form.setFieldsValue({ company_name: d.company_name || 'SVL HRM' });
        setLogoPreview(d.company_logo || '/branding/svl-logo-default.png');
        setBgPreview(d.login_background || '/branding/login-bg-default.jpg');
        setLogoData(undefined);
        setBgData(undefined);
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Failed to load branding');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    load();
  }, [load]);

  const onLogo = async (file) => {
    if (!file.type?.startsWith('image/')) {
      message.error('Please upload an image file');
      return false;
    }
    if (file.size > 3 * 1024 * 1024) {
      message.error('Logo must be under 3MB');
      return false;
    }
    const dataUrl = await fileToDataUrl(file);
    setLogoData(dataUrl);
    setLogoPreview(dataUrl);
    return false;
  };

  const onBackground = async (file) => {
    if (!file.type?.startsWith('image/')) {
      message.error('Please upload an image file');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('Background must be under 5MB');
      return false;
    }
    const dataUrl = await fileToDataUrl(file);
    setBgData(dataUrl);
    setBgPreview(dataUrl);
    return false;
  };

  const save = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = { company_name: values.company_name };
      if (logoData !== undefined) payload.company_logo = logoData;
      if (bgData !== undefined) payload.login_background = bgData;
      const res = await api.put('/settings/branding', payload);
      if (res.data.success) {
        message.success('Branding updated');
        setBrandingFromSave(res.data.data);
        await refreshBranding();
        load();
      }
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const resetLogo = async () => {
    setSaving(true);
    try {
      const res = await api.put('/settings/branding', { clear_logo: true });
      if (res.data.success) {
        message.success('Logo reset to default');
        setBrandingFromSave(res.data.data);
        await refreshBranding();
        load();
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  const resetBackground = async () => {
    setSaving(true);
    try {
      const res = await api.put('/settings/branding', { clear_background: true });
      if (res.data.success) {
        message.success('Background reset to default');
        setBrandingFromSave(res.data.data);
        await refreshBranding();
        load();
      }
    } catch (e) {
      message.error(e.response?.data?.message || 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-branding">
      <Card
        loading={loading}
        title={(
          <span>
            <PictureOutlined style={{ marginRight: 8 }} />
            Branding & Login Appearance
          </span>
        )}
        extra={(
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={save}>
            Save changes
          </Button>
        )}
      >
        <Form form={form} layout="vertical" initialValues={{ company_name }}>
          <Form.Item
            name="company_name"
            label="Company name"
            rules={[{ required: true, message: 'Enter a company name' }]}
          >
            <Input maxLength={120} placeholder="SVL HRM" />
          </Form.Item>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <h3 style={{ marginBottom: 12 }}>Company logo</h3>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Shown on the login page, sidebar, and dashboard header.
              </p>
              <div className="branding-preview-logo">
                <Image src={logoPreview} alt="Logo preview" style={{ maxHeight: 96, objectFit: 'contain' }} />
              </div>
              <Space wrap style={{ marginTop: 12 }}>
                <Upload accept="image/*" showUploadList={false} beforeUpload={onLogo}>
                  <Button icon={<UploadOutlined />}>Upload logo</Button>
                </Upload>
                <Button icon={<ClearOutlined />} onClick={resetLogo}>
                  Use default
                </Button>
              </Space>
            </Col>

            <Col xs={24} md={12}>
              <h3 style={{ marginBottom: 12 }}>Login background</h3>
              <p style={{ color: '#64748b', marginBottom: 12 }}>
                Full-bleed image behind the sign-in form.
              </p>
              <div className="branding-preview-bg">
                <Image src={bgPreview} alt="Background preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />
              </div>
              <Space wrap style={{ marginTop: 12 }}>
                <Upload accept="image/*" showUploadList={false} beforeUpload={onBackground}>
                  <Button icon={<UploadOutlined />}>Upload background</Button>
                </Upload>
                <Button icon={<ClearOutlined />} onClick={resetBackground}>
                  Use default
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default BrandingSettings;
