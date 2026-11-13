import api from './api';

export const getConnections = () => api.get('/connections');
export const sendConnectionRequest = (data) => api.post('/connections/request', data);
export const getConnectionRequests = (type = 'all') => api.get('/connections/requests', { params: { type } });
export const respondConnectionRequest = (id, status) => api.put(`/connections/respond/${id}`, { status });
export const cancelConnectionRequest = (id) => api.delete(`/connections/request/${id}`);
export const removeConnection = (userId) => api.delete(`/connections/${userId}`);
