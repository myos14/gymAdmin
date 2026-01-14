import api from './api';

export const memberService = {
  getAllMembers: async (filters = {}) => {
    const response = await api.get('/members/', { params: filters });
    return response.data;
  },

  getMember: async (id) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  searchMembers: async (query) => {
    const response = await api.get('/members/', { params: { search: query } });
    return response.data;
  },

  createMember: async (data) => {
    const response = await api.post('/members/', data);
    return response.data;
  },

  updateMember: async (id, data) => {
    const response = await api.put(`/members/${id}`, data);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/members/${id}/toggle-status`);
    return response.data;
  },

  deleteMember: async (id) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  }
};