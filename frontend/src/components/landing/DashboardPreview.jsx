import { motion } from 'framer-motion'
import { Activity, BarChart3, MessageSquare, Sparkles, Users, Zap } from 'lucide-react'

const activities = [
  { user: 'Alex', action: 'generated roadmap', time: '2m ago' },
  { user: 'Maya', action: 'joined team Nova', time: '5m ago' },
  { user: 'Jordan', action: 'ran skill analysis', time: '8m ago' },
]

export default function DashboardPreview() {
  return (
    <section id="platform" className="relative px-4 sm:px-6 pb-24 -mt-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-6xl mx-auto"
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="dark-glass-card p-4 sm:p-6 border border-violet-500/20 shadow-[0_0_60px_rgba(124,58,237,0.2)]"
        >
          <div className="flex items-center gap-2 mb-4 px-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-xs text-slate-500 font-mono">innovx.ai/dashboard — live preview</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <div className="dark-inner-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">AI Analytics</span>
                  <BarChart3 size={16} className="text-cyan-400" />
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-violet-600 to-cyan-400"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">+24% AI generations this week</p>
              </div>

              <div className="dark-inner-card p-4">
                <p className="text-sm font-semibold text-white mb-3">Team</p>
                <div className="flex -space-x-2">
                  {['PS', 'AP', 'MC', 'JK', '+3'].map((a, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full border-2 border-[#050816] bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white"
                    >
                      {a}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                  <Users size={12} /> 6 collaborators online
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MessageSquare, label: 'AI Chat', stat: '1.2k msgs' },
                  { icon: Sparkles, label: 'Generators', stat: '847 runs' },
                  { icon: Zap, label: 'Automation', stat: '12 flows' },
                  { icon: Activity, label: 'Insights', stat: '99.2%' },
                ].map((t, i) => (
                  <motion.div
                    key={t.label}
                    whileHover={{ scale: 1.03 }}
                    className="dark-inner-card p-4 group cursor-default"
                  >
                    <t.icon size={18} className="text-violet-400 group-hover:text-cyan-400 transition-colors mb-2" />
                    <p className="text-sm font-semibold text-white">{t.label}</p>
                    <p className="text-xs text-cyan-400/80 mt-1">{t.stat}</p>
                  </motion.div>
                ))}
              </div>

              <div className="dark-inner-card p-4">
                <p className="text-sm font-semibold text-white mb-3">Collaboration</p>
                <div className="space-y-2">
                  {['Nova Labs — 4 members', 'Hackathon Squad — 3 members'].map(team => (
                    <div key={team} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-xs text-slate-300">{team}</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="dark-inner-card p-4 h-full">
                <p className="text-sm font-semibold text-white mb-3">Live Activity</p>
                <div className="space-y-3">
                  {activities.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="text-xs"
                    >
                      <p className="text-slate-300">
                        <span className="text-white font-medium">{a.user}</span> {a.action}
                      </p>
                      <p className="text-slate-600 mt-0.5">{a.time}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
