import api from './api';

export const reportsService = {
    async getReports(period = 'month') {
        const response = await api.get(`/reports/summary?period=${period}`);
        return response.data;
    },

    async getMonthlyComparison() {
        const response = await api.get('/reports/monthly-comparison');
        return response.data;
    }
};