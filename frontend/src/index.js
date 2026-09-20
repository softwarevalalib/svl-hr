import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import axios from 'axios';
import './index.css';
import App from './App';
import { API_URL } from './config/api';

// Point relative /api/* calls at the configured backend (Vercel / Neon API host)
const apiRoot = API_URL.replace(/\/api\/?$/, '');
if (apiRoot) {
  axios.defaults.baseURL = apiRoot;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1f6f8b',
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
