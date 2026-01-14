import api from './api';

export const subscriptionService = {
    getAllSubscriptions: async (filters = {}) => {
        const response = await api.get('/subscriptions/', { params: filters });
        return response.data;
    },

    getSubscription: async (id) => {
        const response = await api.get(`/subscriptions/${id}`);
        return response.data;
    },

    getMemberActiveSubscription: async (memberId) => {
        try {
            const response = await api.get(`/subscriptions/member/${memberId}/active`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },

    createSubscription: async (data) => {
        const response = await api.post('/subscriptions/', data);
        return response.data;
    },

    updateSubscription: async (id, data) => {
        const response = await api.put(`/subscriptions/${id}`, data);
        return response.data;
    },

    cancelSubscription: async (id) => {
        const response = await api.put(`/subscriptions/${id}`, { status: 'cancelled' });
        return response.data;
    },

    deleteSubscription: async (id) => {
        const response = await api.delete(`/subscriptions/${id}`);
        return response.data;
    },

    renewSubscription: async (id, data) => {
        const response = await api.post(`/subscriptions/${id}/renew`, data);
        return response.data;
    }
};