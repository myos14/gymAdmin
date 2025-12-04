import { getMembers, getMemberById, searchMembers as apiSearchMembers } from './api';

export const memberService = {
    getAllMembers: async () => {
        const response = await getMembers();
        return response.data;
    },

    getMember: async (id) => {
        const response = await getMemberById(id);
        return response.data;
    },

    searchMembers: async (query) => {
        const response = await apiSearchMembers(query);
        return response.data;
    }    
}