import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const DEFAULTS = {
  company_name: 'SVL HRM',
  company_logo: null,
  login_background: null,
  logoUrl: '/branding/svl-logo-default.png',
  backgroundUrl: '/branding/login-bg-default.jpg',
};

const BrandingContext = createContext(DEFAULTS);

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const applyPayload = useCallback((data) => {
    const company_name = data?.company_name || DEFAULTS.company_name;
    const company_logo = data?.company_logo || null;
    const login_background = data?.login_background || null;
    setBranding({
      company_name,
      company_logo,
      login_background,
      logoUrl: company_logo || DEFAULTS.logoUrl,
      backgroundUrl: login_background || DEFAULTS.backgroundUrl,
    });
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/branding`);
      if (res.data.success) applyPayload(res.data.data);
    } catch (e) {
      applyPayload(null);
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  const value = useMemo(
    () => ({
      ...branding,
      loading,
      refreshBranding,
      setBrandingFromSave: applyPayload,
    }),
    [branding, loading, refreshBranding, applyPayload]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);

export default BrandingContext;
