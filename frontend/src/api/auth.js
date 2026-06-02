import api from './axios'

export const register = (data) => api.post('/api/v1/auth/register', data)
export const login = (data) => api.post('/api/v1/auth/login', data)
export const logout = (refresh_token) => api.post('/api/v1/auth/logout', { refresh_token })
export const getMe = () => api.get('/api/v1/auth/me')