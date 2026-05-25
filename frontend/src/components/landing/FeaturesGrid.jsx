import { motion } from 'framer-motion'
import { MessageSquare, Code2, Image, Users, BarChart3, Workflow } from 'lucide-react'

const features = [
  { icon: MessageSquare, title: 'AI Chat Assistant', desc: 'Context-aware copilot for ideas, strategy, and instant answers.', grad: 'from-violet-500 to-indigo-600' },
  { icon: Code2, title: 'AI Code Generator', desc: 'Roadmaps, resumes, project scaffolds, and skill verification.', grad: 'from-cyan-500 to-blue-600' },
  { icon: Image, title: 'AI Image Creator', desc: 'Visualize concepts and pitch materials with generative outputs.', grad: 'from-pink-500 to-rose-600' },
  { icon: Users, title: 'Smart Collaboration', desc: 'Teams, invites, matching, and real-time innovation workspaces.', grad: 'from-indigo-500 to-violet-600' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Innovation scores, heatmaps, and ecosystem growth metrics.', grad: 'from-emerald-500 to-teal-600' },
  { icon: Workflow, title: 'Automation Workflows', desc: 'Chain AI tools into repeatable innovation pipelines.', grad: 'from-amber-500 to-orange-600' },
]

const fade = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 },
}

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div {...fade} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Everything you need to build faster
          </h2>
          <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
            Six powerful modules designed for students, founders, and innovation teams.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fade}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="dark-feature-card group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="text-white" size={22} />
              </div>
              <h3 className="text-lg font-bold text-white">{f.title}</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
