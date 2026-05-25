import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import AuthSplitLayout from '../../components/auth/AuthSplitLayout'

const DEPARTMENTS = ['Computer Science', 'Data Science', 'Electrical Engineering', 'Mechanical Engineering', 'Business', 'Design', 'Mathematics', 'Physics', 'Other']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', university: '' })

  const handleRegister = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('Welcome to InnovX AI')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      title="Start your innovation journey"
      subtitle="Create a free account and unlock AI tools, collaboration, and your personalized innovation feed."
    >
      <h2 className="text-2xl font-black text-white mb-1">Create account</h2>
      <p className="text-slate-400 text-sm mb-6">Join thousands of innovators on InnovX</p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
          <input
            className="dark-input py-3"
            placeholder="John Doe"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
          />
        </div>
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
              placeholder="Min 8 characters"
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
            <select
              className="dark-input py-3"
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            >
              <option value="">Select...</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">University</label>
            <input
              className="dark-input py-3"
              placeholder="MIT, Stanford..."
              value={form.university}
              onChange={e => setForm(p => ({ ...p, university: e.target.value }))}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="dark-btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create account <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
