import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const tools = ['Ideas', 'Skills', 'Resume', 'Roadmap', 'Startup AI', 'Verify', 'Innovation Score', 'Assistant']

export default function ToolsSection() {
  return (
    <section id="tools" className="py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Powered by Gemini AI</h2>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tools.map(t => (
              <span
                key={t}
                className="px-4 py-2 rounded-full text-sm font-medium text-slate-300 border border-violet-500/20 bg-violet-500/5 hover:border-cyan-500/40 hover:text-cyan-300 transition-all"
              >
                {t}
              </span>
            ))}
          </div>
          <Link to="/register" className="dark-btn-primary inline-flex items-center gap-2">
            Unlock AI Tools <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
