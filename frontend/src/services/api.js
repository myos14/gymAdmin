import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});

// Configure interceptors to manage auth token
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

// Interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Members
export const getMembers = (params) => api.get('/members/', {params});
export const getMemberById = (id) => api.get(`/members/${id}`);
export const searchMembers = (query) => api.get(`/members/?search=${query}`);

// Attendance
export const checkIn = (data) => api.post('/attendance/check-in', data);
export const checkOut = (id, data) => api.put(`/attendance/${id}/check-out`, data);
export const getCurrentInGym = () => api.get('/attendance/current/in-gym');
export const getDailyStats = (date) => api.get('/attendance/stats/daily', {params: {target_date: date} });
export const getAttendances = (params) => api.get('/attendance/', {params});

// Subscriptions
export const getSubscriptions = (params) => api.get('/subscriptions/', { params });
export const getSubscriptionById = (id) => api.get(`/subscriptions/${id}`);
export const getMemberActiveSubscription = (memberId) => api.get(`/subscriptions/member/${memberId}/active`);
export const createSubscription = (data) => api.post('/subscriptions/', data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}`, data);
export const deleteSubscription = (id) => api.delete(`/subscriptions/${id}`);

// Plans
export const getPlans = (params) => api.get('/plans/', {params});
export const getPlanById = (id) => api.get(`/plans/${id}`); 
export const createPlan = (data) => api.post('/plans/', data);
export const updatePlan = (id, data) => api.put(`/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/plans/${id}`);

export default api;