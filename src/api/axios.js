import axios from 'axios';

const isProd = typeof window !== 'undefined'
    && !window.location.hostname.includes('localhost')
    && !window.location.hostname.includes('127.0.0.1');

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isProd ? 'https://back-end-production-3fa3.up.railway.app/api' : '/api'),
    headers: {
        'Accept': 'application/json',
    },
    timeout: 30000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (globalThis.location.pathname !== '/login') {
                globalThis.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
