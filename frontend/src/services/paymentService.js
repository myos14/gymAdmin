import api from './api';

export const paymentService = {
    getPayments: async (filters = {}) => {
        const response = await api.get('/payments/', { params: filters });
        return response.data;
    }
};