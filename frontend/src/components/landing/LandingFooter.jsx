import { Link } from 'react-router-dom'
import { Sparkles, Github, Twitter, Linkedin, Mail } from 'lucide-react'

export default function LandingFooter() {
  return (
    <footer id="contact" className="border-t border-white/5 py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <span className="font-bold text-white">InnovX AI</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Premium AI innovation platform for teams that build the future.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
            <Mail size={14} className="text-cyan-400" /> hello@innovx.ai
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
            <li><a href="#platform" className="hover:text-cyan-400 transition-colors">Platform</a></li>
            <li><a href="#tools" className="hover:text-cyan-400 transition-colors">AI Tools</a></li>
            <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><a href="#about" className="hover:text-cyan-400 transition-colors">About</a></li>
            <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Sign In</Link></li>
            <li><Link to="/register" className="hover:text-cyan-400 transition-colors">Register</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-4">Newsletter</h4>
          <p className="text-sm text-slate-500 mb-3">Get product updates and AI tips.</p>
          <form
            onSubmit={e => e.preventDefault()}
            className="flex gap-2"
          >
            <input
              type="email"
              placeholder="you@email.com"
              className="dark-input flex-1 text-sm py-2.5"
            />
            <button type="submit" className="dark-btn-primary text-sm py-2.5 px-4">
              Join
            </button>
          </form>
          <div className="flex gap-3 mt-6">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-600 mt-12 pt-8 border-t border-white/5 max-w-6xl mx-auto">
        © {new Date().getFullYear()} InnovX AI. All rights reserved.
      </p>
    </footer>
  )
}
