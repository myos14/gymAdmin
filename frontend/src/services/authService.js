import api from './api';

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', {
            username,
            password
        });
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};