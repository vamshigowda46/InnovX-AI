import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Users, Brain } from 'lucide-react'
import DarkBackground from '../landing/DarkBackground'

export default function AuthSplitLayout({ children, title, subtitle }) {
  return (
    <div className="auth-dark-page min-h-screen flex bg-[#050816] relative overflow-hidden">
      <DarkBackground />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-between border-r border-white/5">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.5)]">
            <Sparkles className="text-white" size={22} />
          </div>
          <span className="font-bold text-white text-xl">
            InnovX <span className="text-cyan-400">AI</span>
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <h2 className="text-4xl font-black text-white leading-tight">{title}</h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">{subtitle}</p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Brain, label: 'AI Tools' },
              { icon: Users, label: 'Collaborate' },
              { icon: Zap, label: 'Innovate' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="dark-inner-card p-4 text-center border border-violet-500/20"
                style={{ background: 'rgba(17, 25, 40, 0.75)' }}
              >
                <Icon className="text-cyan-400 mx-auto mb-2" size={22} />
                <p className="text-white text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-slate-600 text-sm">© InnovX AI — Intelligence that scales with you</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)]">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="font-bold text-white text-lg">InnovX AI</span>
            </Link>
          </div>

          <div className="dark-form-card p-8 sm:p-10">
            {children}
          </div>

          <p className="text-center mt-6">
            <Link to="/" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
