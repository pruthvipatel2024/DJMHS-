import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Access Token into request authorization headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sdjm_token') || sessionStorage.getItem('sdjm_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Interceptor to handle session expiration or enforced password resets & auto-retry transient errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ success?: boolean; message?: string; code?: string; error?: string }>) => {
    const status = error.response?.status;
    const config = error.config as (InternalAxiosRequestConfig & { _retryCount?: number }) | undefined;

    // Handle token expired / unauthorized session eviction
    if (status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('sdjm_token');
        localStorage.removeItem('sdjm_user');
        sessionStorage.removeItem('sdjm_token');
        sessionStorage.removeItem('sdjm_user');
        window.location.href = '/login?expired=1';
      }
      return Promise.reject(error);
    }

    // Auto-retry transient network errors or 500/502/503/504 if backend was re-establishing PostgreSQL pool
    if (config && (!status || [500, 502, 503, 504].includes(status))) {
      config._retryCount = config._retryCount || 0;
      if (config._retryCount < 2) {
        config._retryCount += 1;
        // Wait 350ms before retrying
        await new Promise((resolve) => setTimeout(resolve, config._retryCount * 350));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
