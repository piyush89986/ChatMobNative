import axios from 'axios';
import { storage } from '../utils/storage';
import { DEFAULT_HOST } from '../utils/constants';

let cachedBaseUrl = DEFAULT_HOST;

export const setApiBaseUrl = (url) => {
  if (url) {
    cachedBaseUrl = url.replace(/\/$/, '');
  }
};

export const getApiBaseUrl = () => cachedBaseUrl;

const apiClient = axios.create({
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to dynamically attach baseURL and Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const savedUrl = await storage.getServerUrl();
    let activeUrl = savedUrl || cachedBaseUrl || DEFAULT_HOST;
    if (!__DEV__) {
      if (
        !activeUrl ||
        activeUrl.includes('localhost') ||
        activeUrl.includes('10.') ||
        activeUrl.includes('192.168.') ||
        activeUrl.includes('172.') ||
        activeUrl.includes(':4100') ||
        activeUrl.includes(':4000') ||
        !activeUrl.startsWith('https://')
      ) {
        activeUrl = DEFAULT_HOST;
      }
    }
    config.baseURL = activeUrl.replace(/\/$/, '');

    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Crucial for React Native multipart uploads: remove default application/json so boundary is generated
    if (config.data instanceof FormData || (config.headers && config.headers['Content-Type'] === 'multipart/form-data')) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for user-friendly error normalization
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = 'Network connection failed. Check if server is running.';
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        message = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        const cleanStr = error.response.data.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        message = cleanStr.length > 150 ? `${cleanStr.slice(0, 150)}...` : cleanStr;
      } else {
        message = `Server error (${error.response.status})`;
      }
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. Server is taking too long to respond.';
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
