import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send } from 'lucide-react'
import api, { getAiErrorMessage } from '../../utils/api'
import toast from 'react-hot-toast'

export default function AIOrb() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I\'m your InnovX AI assistant. Ask me about projects, teammates, hackathons, or startup ideas.' },
  ])

  const ask = async () => {
    if (!query.trim()) return
    const q = query.trim()
    setMessages(m => [...m, { role: 'user', text: q }])
    setQuery('')
    setLoading(true)
    try {
      const { data } = await api.post('/ai/assistant', { query: q })
      const a = data.assistant
      setMessages(m => [...m, {
        role: 'assistant',
        text: a.response,
        suggestions: a.suggestions,
        ideas: a.ideas,
      }])
    } catch (err) {
      toast.error(getAiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full btn-3d flex items-center justify-center animate-glow-pulse"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="AI Assistant"
      >
        <motion.div
          animate={{ rotate: open ? 0 : 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-white/30"
        />
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[min(400px,calc(100vw-3rem))] glass-premium rounded-2xl depth-shadow overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100/80 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-500" /> InnovX AI Assistant
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Projects · Teams · Ideas · Strategy</p>
            </div>
            <div className="h-72 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[90%] px-3 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-700 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.suggestions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.suggestions.slice(0, 3).map((s, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-1 px-3">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-indigo-400"
                      animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.5 }} />
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ask()}
                placeholder="Ask anything..."
                className="input flex-1 py-2 text-sm"
              />
              <button onClick={ask} disabled={loading} className="btn-3d p-2.5">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
