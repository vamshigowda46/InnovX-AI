import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen premium-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <p className="text-8xl font-black gradient-text">404</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-4">Page not found</h1>
        <p className="text-slate-500 mt-2 mb-8">The page you are looking for does not exist or was moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
            <Home size={18} /> Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary inline-flex items-center justify-center gap-2">
            <ArrowLeft size={18} /> Go back
          </button>
        </div>
      </motion.div>
    </div>
  )
}
