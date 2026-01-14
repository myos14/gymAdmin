import api from './api';

export const planService = {
    getAllPlans: async (statusFilter = 'active') => {
        let params = {};
        
        if (statusFilter === 'active') {
            params.active_only = true;
        } else if (statusFilter === 'inactive') {
            params.active_only = false;
        }
        
        const response = await api.get('/plans/', { params });
        return response.data;
    },

    getPlan: async (id) => {
        const response = await api.get(`/plans/${id}`);
        return response.data;
    },

    createPlan: async (data) => {
        const response = await api.post('/plans/', data);
        return response.data;
    },

    updatePlan: async (id, data) => {
        const response = await api.put(`/plans/${id}`, data);
        return response.data;
    },

    toggleStatus: async (id, currentStatus) => {
        const response = await api.put(`/plans/${id}`, { 
            is_active: !currentStatus 
        });
        return response.data;
    },

    deletePlan: async (id) => {
        const response = await api.delete(`/plans/${id}`);
        return response.data;
    }
};