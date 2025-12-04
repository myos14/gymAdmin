import {
    checkIn as apiCheckIn,
    checkOut as apiCheckOut,
    getCurrentInGym,
    getDailyStats,
    getAttendances
} from './api';

export const attendanceService = {
    checkIn: async (memberId, notes = null) => {
        const response = await apiCheckIn({
            member_id: memberId,
            notes: notes
        });
        return response.data;
    },

    checkOut: async (attendanceId, notes = null) => {
        const response = await apiCheckOut(attendanceId, {
            notes: notes
        });
        return response.data;
    },

    getCurrentInGym: async () => {
        const response = await getCurrentInGym();
        return response.data;
    },

    getDailyStats: async (date = null) => {
        const targetDate = date || new Date().toISOString().split('T')[0];
        const response = await getDailyStats(targetDate);
        return response.data;
    },

    getAttendances: async (params = {}) => {
        const response = await getAttendances(params);
        return response.data;
    }
};