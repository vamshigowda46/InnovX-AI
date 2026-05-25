import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import AuthSplitLayout from '../../components/auth/AuthSplitLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
      navigate(redirect)
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = async () => {
    setLoading(true)
    try {
      await login('alex@demo.com', 'Demo@1234')
      toast.success('Demo login successful!')
      navigate('/dashboard')
    } catch {
      toast.error('Demo login failed. Ensure the backend and database are running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Welcome back to InnovX"
      subtitle="Sign in to access your dashboard, AI tools, collaboration workspace, and innovation feed."
    >
      <h2 className="text-2xl font-black text-white mb-1">Sign in</h2>
      <p className="text-slate-400 text-sm mb-6">Enter your credentials to continue</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            className="dark-input py-3"
            placeholder="you@university.edu"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              className="dark-input py-3 pr-10"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="dark-btn-primary w-full flex items-center justify-center gap-2 py-3">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Sign In <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs text-slate-500 bg-transparent" style={{ background: 'rgba(17,25,40,0.9)' }}>or</span>
        </div>
      </div>

      <button type="button" onClick={demoLogin} disabled={loading} className="w-full dark-btn-ghost py-3 text-sm">
        Try Demo Account
      </button>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300">
          Sign up free
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
