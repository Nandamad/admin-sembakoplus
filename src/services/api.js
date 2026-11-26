import axios from 'axios'

export const ADMIN_TOKEN_KEY = 'sembakoplus.admin.token'
export const ADMIN_USER_KEY = 'sembakoplus.admin.user'
export const ADMIN_PROFILE_EVENT = 'sembakoplus:admin-profile-updated'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAdminSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getStoredAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAdminUser(user) {
  if (!user) return false
  if (Array.isArray(user.roles)) {
    return user.roles.includes('admin')
  }
  return user.role === 'admin'
}

export function saveAdminSession(token, user) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  if (user) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(ADMIN_PROFILE_EVENT))
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
  window.dispatchEvent(new Event(ADMIN_PROFILE_EVENT))
}

export function extractApiError(error, fallback = 'Permintaan gagal diproses.') {
  const details = error?.response?.data?.error?.details || error?.response?.data?.errors
  if (details && typeof details === 'object') {
    const first = Object.values(details).flat().find(Boolean)
    if (first) return String(first)
  }
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export default api
