import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Perfect for exploring AI innovation',
    features: ['Core AI tools', 'Innovation feed', 'Basic collaboration', 'Community support'],
    cta: 'Start Free',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    desc: 'For teams building seriously',
    features: ['Unlimited AI generations', 'Priority matching', 'Advanced analytics', 'Team workspaces', 'API access'],
    cta: 'Start Pro Trial',
    primary: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For universities & organizations',
    features: ['SSO & admin console', 'Custom branding', 'Dedicated support', 'SLA & compliance', 'On-prem options'],
    cta: 'Book Demo',
    primary: false,
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-white">Simple, transparent pricing</h2>
          <p className="text-slate-400 mt-3">Scale from solo builder to campus-wide deployment</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: p.primary ? -8 : -4 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                p.primary
                  ? 'dark-pricing-pro scale-[1.02] z-10'
                  : 'dark-glass-card border border-white/5'
              }`}
            >
              {p.primary && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-cyan-500 text-white">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold text-white">{p.name}</h3>
              <p className="text-4xl font-black mt-4 text-white">
                {p.price}
                {p.period && <span className="text-base text-slate-500 font-medium">{p.period}</span>}
              </p>
              <p className="text-slate-400 text-sm mt-2">{p.desc}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={16} className="text-cyan-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.name === 'Enterprise' ? '/login' : '/register'}
                className={`mt-8 block text-center py-3 rounded-xl font-semibold transition-all ${
                  p.primary ? 'dark-btn-primary' : 'dark-btn-ghost'
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
