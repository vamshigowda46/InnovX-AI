import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState(null)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setUserId(data.user_id)
      setStep(2)
      toast.success('OTP sent to your email!')
    } catch { toast.error('Failed to send OTP') }
    finally { setLoading(false) }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { user_id: userId, otp, new_password: newPassword })
      toast.success('Password reset successfully!')
      setStep(3)
    } catch (err) { toast.error(err.response?.data?.error || 'Reset failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg mb-4">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Reset Password</h1>
        </div>
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/60">
          {step === 1 && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input type="email" className="input" placeholder="you@university.edu" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">OTP Code</label>
                <input className="input text-center text-2xl tracking-widest font-bold" placeholder="000000"
                  maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input type="password" className="input" placeholder="Min 8 characters" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="font-bold text-slate-800 mb-2">Password Reset!</h3>
              <p className="text-slate-500 text-sm mb-4">Your password has been reset successfully.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">Go to Login <ArrowRight size={16} /></Link>
            </div>
          )}
          {step < 3 && (
            <p className="text-center text-sm text-slate-500 mt-4">
              <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">← Back to Login</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
