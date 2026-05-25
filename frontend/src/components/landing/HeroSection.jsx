import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'

export default function HeroSection() {
  return (
    <section id="home" className="relative pt-32 sm:pt-40 pb-16 px-4 sm:px-6">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[min(900px,90vw)] h-[400px] bg-gradient-to-r from-violet-600/20 via-cyan-500/15 to-pink-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 text-sm font-medium mb-8"
        >
          <Sparkles size={14} className="text-cyan-400" />
          AI-powered innovation platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight"
        >
          Intelligence that{' '}
          <span className="dark-gradient-text animate-gradient-shift">scales with you</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
        >
          InnovX AI transforms how teams automate workflows, analyze data, collaborate, and build
          AI-powered solutions from one beautifully designed platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-12"
        >
          <Link to="/register" className="dark-btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-base">
            Start Building Free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="dark-btn-ghost inline-flex items-center gap-2 px-8 py-3.5 text-base">
            <Play size={16} className="text-cyan-400" /> Watch Demo
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
