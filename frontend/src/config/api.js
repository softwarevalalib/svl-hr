const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/** Absolute or relative API root ending without trailing slash, e.g. https://api.example.com/api or /api */
export const API_URL = API_BASE || '/api';

export default API_URL;
