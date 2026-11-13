import api from './api';

export const getUsers = (params) => api.get('/users', { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateProfile = (data) => api.put('/users/profile', data);
export const getRecommendations = () => api.get('/users/recommendations');
export const getLeaderboard = () => api.get('/users/leaderboard');
export const getStats = () => api.get('/users/stats');
export const getTrendingSkills = () => api.get('/users/trending-skills');

// Admin services
export const adminGetUsers = (params) => api.get('/users/admin/users', { params });
export const adminDeleteUser = (id) => api.delete(`/users/admin/${id}`);
export const adminUpdateUserRole = (id, role) => api.put(`/users/admin/${id}/role`, { role });
