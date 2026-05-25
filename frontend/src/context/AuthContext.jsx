import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { initSocket, disconnectSocket } from '../utils/socket'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState(null)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      const s = initSocket(token)
      setSocket(s)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    const s = initSocket(data.access_token)
    setSocket(s)
    return data
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData)
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      setUser(data.user)
      const s = initSocket(data.access_token)
      setSocket(s)
    }
    return data
  }

  const verifyOtp = async (userId, otp) => {
    const { data } = await api.post('/auth/verify-otp', { user_id: userId, otp })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    const s = initSocket(data.access_token)
    setSocket(s)
    return data
  }

  const googleLogin = async (token) => {
    const { data } = await api.post('/auth/google', { token })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    const s = initSocket(data.access_token)
    setSocket(s)
    return data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    disconnectSocket()
    setSocket(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }))

  return (
    <AuthContext.Provider value={{ user, loading, socket, login, register, verifyOtp, googleLogin, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
