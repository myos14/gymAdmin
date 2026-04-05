import api from './api';

export const qrService = {
    getMemberQRToken: async (memberId) => {
        const response = await api.get(`/attendance/member/${memberId}/qr-token`);
        return response.data;
    },
    processQRCheckIn: async (token) => {
        const response = await api.post(`/attendance/qr-checkin?token=${encodeURIComponent(token)}`);
        return response.data;
    }
};