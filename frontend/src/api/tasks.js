import api from './axios'

export const getTasks = (params) => api.get('/api/v1/tasks', { params })
export const createTask = (data) => api.post('/api/v1/tasks', data)
export const updateTask = (id, data) => api.patch(`/api/v1/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/api/v1/tasks/${id}`)