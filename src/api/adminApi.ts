import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const adminLogin = (data: { username: string; password: string }) =>
  api.post('/auth/login', data)

// Stats
export const getAdminStats = () => api.get('/admin/stats')

// Users
export const getAdminUsers = (params?: { q?: string; page?: number }) =>
  api.get('/admin/users', { params })
export const updateAdminUser = (id: string, data: Record<string, unknown>) =>
  api.patch(`/admin/users/${id}`, data)

// Reports / Safety
export const getAdminReports = (params?: { status?: string }) =>
  api.get('/admin/reports', { params })
export const resolveReport = (id: string, data: { action: string }) =>
  api.patch(`/admin/reports/${id}/resolve`, data)

// Posts / Content
export const getAdminPosts = (params?: { flagged?: boolean }) =>
  api.get('/admin/posts', { params })
export const deleteAdminPost = (id: string) => api.delete(`/admin/posts/${id}`)

// Creators
export const getAdminCreators = () => api.get('/admin/creators')
export const getAdminPayouts = () => api.get('/admin/payouts')

// Commerce / Marketplace
export const getAdminMarketplace = () => api.get('/admin/marketplace')
export const getAdminTransactions = () => api.get('/admin/transactions')

// Live
export const getAdminLive = () => api.get('/admin/live')
export const deleteAdminLive = (id: string) => api.delete(`/admin/live/${id}`)

export default api
