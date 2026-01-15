import api from './api';

export const dashboardService = {
    getDashboardSummary: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.expiring_days) queryParams.append('expiring_days', params.expiring_days);
        if (params.recent_limit) queryParams.append('recent_limit', params.recent_limit);
        if (params.stats_days) queryParams.append('stats_days', params.stats_days);

        const response = await api.get(`/dashboard/summary?${queryParams}`);
        return response.data;
    }
};