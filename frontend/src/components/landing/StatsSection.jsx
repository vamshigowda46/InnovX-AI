import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

const stats = [
  { end: 12, suffix: 'K+', label: 'Teams' },
  { end: 1, suffix: 'M+', label: 'AI Generations' },
  { end: 50, suffix: 'K+', label: 'Projects' },
  { end: 99.9, suffix: '%', label: 'Uptime', decimals: 1 },
]

export default function StatsSection() {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="dark-stat-card text-center p-6 sm:p-8"
          >
            <p className="text-3xl sm:text-4xl font-black dark-gradient-text">
              <AnimatedCounter end={s.end} suffix={s.suffix} decimals={s.decimals || 0} />
            </p>
            <p className="text-slate-400 text-sm mt-2 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
