import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL : API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
});

// Members
export const getMembers = (params) => api.get('/members/', {params});
export const getMemberById = (id) => api.get(`/members/${id}`);
export const searchMembers = (query) => api.get(`/members/?search=${query}`);

// Attendance
export const checkIn = (data) => api.post('/attendance/check-in', data);
export const checkOut = (id, data) => api.put(`/attendance/${id}/check-out`, data);
export const getCurrentInGym = () => api.get('/attendance/current/in-gym');
export const getDailyStats = (date) => api.get('/attendance/stats/daily', {params: {target_date: date} });
export const getAttendances = (params) => api.get('/attendance/', {params})

// Subscriptions
export const getSubscriptions = () => api.get('/subscriptions/');
export const getActiveSubscriptions = () => api.get('/subscriptions/?status=active');

// Plans
export const getPlans = () => api.get('/plans/');

export default api;