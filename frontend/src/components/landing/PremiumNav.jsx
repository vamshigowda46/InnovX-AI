import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#platform', label: 'Platform' },
  { href: '#tools', label: 'AI Tools' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function PremiumNav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4">
      <nav
        className={`max-w-6xl mx-auto rounded-2xl border transition-all duration-500 ${
          scrolled
            ? 'dark-glass-nav shadow-[0_0_40px_rgba(124,58,237,0.15)] border-violet-500/20'
            : 'dark-glass-nav border-white/5'
        }`}
      >
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)] group-hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] transition-shadow">
              <Sparkles className="text-white" size={18} />
            </div>
            <span className="font-bold text-white tracking-tight">
              InnovX <span className="text-cyan-400">AI</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 hover:text-white transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="dark-btn-primary text-sm py-2 px-5">
              Start Free
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {links.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 px-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-sm"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="pt-3 flex flex-col gap-2 border-t border-white/5 mt-2">
                  <Link to="/login" onClick={() => setOpen(false)} className="dark-btn-ghost text-center py-2.5 text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="dark-btn-primary text-center py-2.5 text-sm">
                    Start Free
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
