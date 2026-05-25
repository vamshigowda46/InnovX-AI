import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 800

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function shouldRetry(error) {
  if (!error.config || error.config.__retryCount >= MAX_RETRIES) return false
  const status = error.response?.status
  if (!error.response) return true
  return status >= 500 || status === 429
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    if (shouldRetry(err)) {
      original.__retryCount = (original.__retryCount || 0) + 1
      await delay(RETRY_DELAY_MS * original.__retryCount)
      return api(original)
    }

    if (err.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` },
          })
          localStorage.setItem('access_token', data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        }
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.response?.data?.detail ||
      (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
      (err.message === 'Network Error' ? 'Cannot reach server. Is the backend running?' : null) ||
      'Something went wrong'

    err.userMessage = message
    return Promise.reject(err)
  }
)

export function getAiErrorMessage(error) {
  return error?.userMessage || error?.response?.data?.error || 'AI request failed'
}

export default api
