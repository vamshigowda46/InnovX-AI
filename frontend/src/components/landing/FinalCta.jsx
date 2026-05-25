import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function FinalCta() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden border border-violet-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/40 via-indigo-900/80 to-cyan-900/40" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwTDQwIDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/30 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/30 rounded-full blur-[80px]" />

        <div className="relative z-10 px-8 sm:px-16 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">Build the future with AI</h2>
          <p className="text-slate-300 mt-4 text-lg max-w-xl mx-auto">
            Join innovators using InnovX AI to create, collaborate, and launch faster than ever.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to="/register" className="dark-btn-primary inline-flex items-center gap-2 px-8 py-3.5">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white border border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur transition-all">
              Book Demo
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
