import { motion } from 'framer-motion'
import { Zap, Users, BarChart3, Shield, Plug } from 'lucide-react'

const reasons = [
  { icon: Zap, title: 'Faster workflow', desc: 'Automate ideation, analysis, and planning in minutes—not days.' },
  { icon: Users, title: 'AI-powered collaboration', desc: 'Smart teammate matching and seamless team invites.' },
  { icon: BarChart3, title: 'Real-time analytics', desc: 'Track innovation momentum with live dashboards and scores.' },
  { icon: Shield, title: 'Secure cloud infrastructure', desc: 'JWT auth, protected routes, and enterprise-ready patterns.' },
  { icon: Plug, title: 'Easy integrations', desc: 'Connect campus tools, APIs, and your existing stack.' },
]

export default function WhyInnovX() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white">Why teams choose InnovX AI</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">Built for speed, trust, and scale—from campus labs to funded startups.</p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-cyan-500/50 to-transparent" />
          <div className="space-y-6">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 items-start md:pl-4"
              >
                <div className="relative z-10 w-16 h-16 rounded-2xl dark-inner-card flex items-center justify-center flex-shrink-0 border border-violet-500/30">
                  <r.icon className="text-cyan-400" size={26} />
                </div>
                <div className="dark-glass-card flex-1 p-6 border border-white/5">
                  <h3 className="text-lg font-bold text-white">{r.title}</h3>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">{r.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
