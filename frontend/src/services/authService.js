import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

export const authService = {
    login: async (username, password) => {
        const response = await axios.post(`${API_URL}/login`, {
            username,
            password
        });
        return response.data;
    },

    register: async (userData) => {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/register`, userData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getMe: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};