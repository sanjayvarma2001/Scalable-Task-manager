import api from './axios'

export const getUsers = (params) => api.get('/api/v1/admin/users', { params })
export const updateRole = (id, role) => api.patch(`/api/v1/admin/users/${id}/role`, { role })
export const toggleActive = (id) => api.patch(`/api/v1/admin/users/${id}/toggle-active`)
export const deleteUser = (id) => api.delete(`/api/v1/admin/users/${id}`)