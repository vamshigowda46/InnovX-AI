import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Copy, RotateCcw, Mic, Paperclip, Rocket, Trophy, Users, Lightbulb, Layers, BarChart3 } from 'lucide-react'
import api, { getAiErrorMessage } from '../../utils/api'
import toast from 'react-hot-toast'

const QUICK_ACTIONS = [
  { icon: Rocket, label: 'Build MVP Plan', query: 'Create a detailed 2-week MVP plan for my startup idea with milestones and tech stack.' },
  { icon: Trophy, label: 'Hackathon Ideas', query: 'Suggest 5 winning hackathon project ideas for a 48-hour build with team roles.' },
  { icon: Users, label: 'Team Strategy', query: 'How should I find and structure a balanced innovation team on campus?' },
  { icon: Lightbulb, label: 'Startup Ideas', query: 'Generate 3 validated startup ideas in edtech with problem, solution, and monetization.' },
  { icon: Layers, label: 'Generate Architecture', query: 'Design a scalable system architecture for an AI collaboration platform.' },
  { icon: BarChart3, label: 'Growth Strategy', query: 'Outline a 90-day growth strategy for a student innovation platform.' },
]

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.*$)/gm, '<h4 class="font-bold mt-2 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-base mt-2 mb-1">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>')
}

export default function PremiumAssistant() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '### Welcome to InnovX AI\n\nI\'m your **premium innovation copilot** — ask about MVPs, hackathons, teams, architecture, resumes, or growth strategy.\n\nPick a quick action below or type your question.' },
  ])
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text, regenerate = false) => {
    const q = (text || query).trim()
    if (!q || loading) return

    let nextMessages = messages
    if (regenerate && messages.length >= 2) {
      nextMessages = messages.slice(0, -1)
    } else if (!regenerate) {
      nextMessages = [...messages, { role: 'user', content: q }]
      setQuery('')
    }

    setMessages(nextMessages)
    setLoading(true)

    const history = nextMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))

    try {
      const { data } = await api.post('/ai/assistant', { query: q, history })
      const a = data.assistant
      setMessages(m => [...m, {
        role: 'assistant',
        content: a.response || a.text || 'Here is my guidance.',
        suggestions: a.suggestions,
        ideas: a.ideas,
      }])
    } catch (err) {
      toast.error(getAiErrorMessage(err))
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I could not process that. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const copyMsg = (content) => {
    navigator.clipboard.writeText(content.replace(/<[^>]+>/g, ''))
    toast.success('Copied')
  }

  const panelW = expanded ? 'min(560px, calc(100vw - 2rem))' : 'min(420px, calc(100vw - 2rem))'
  const panelH = expanded ? 'min(720px, calc(100vh - 6rem))' : 'min(520px, calc(100vh - 8rem))'

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.45)]"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label="AI Assistant"
      >
        {open ? <X className="text-white" size={22} /> : <Sparkles className="text-white" size={22} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col rounded-2xl overflow-hidden border border-violet-200/60 shadow-2xl"
            style={{ width: panelW, height: panelH, background: 'linear-gradient(180deg, #fafbff 0%, #f5f3ff 100%)' }}
          >
            <div className="px-4 py-3 border-b border-violet-100 flex items-center justify-between bg-white/80 backdrop-blur">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-600" /> InnovX Copilot
                </h3>
                <p className="text-[10px] text-slate-500">Powered by Gemini · Context-aware</p>
              </div>
              <button type="button" onClick={() => setExpanded(!expanded)} className="text-xs text-violet-600 font-semibold px-2 py-1 rounded-lg hover:bg-violet-50">
                {expanded ? 'Compact' : 'Expand'}
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    {msg.role === 'assistant' && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                        <button type="button" onClick={() => copyMsg(msg.content)} className="text-slate-400 hover:text-violet-600"><Copy size={14} /></button>
                        {i === messages.length - 1 && (
                          <button type="button" onClick={() => send(messages[i - 1]?.content, true)} className="text-slate-400 hover:text-violet-600"><RotateCcw size={14} /></button>
                        )}
                      </div>
                    )}
                    {msg.suggestions?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {msg.suggestions.map((s, j) => (
                          <button key={j} type="button" onClick={() => send(s)} className="text-[10px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-slate-500">InnovX is thinking</span>
                  {[0, 1, 2].map(i => (
                    <motion.span key={i} className="w-2 h-2 rounded-full bg-violet-500"
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                  ))}
                </div>
              )}
            </div>

            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
              {QUICK_ACTIONS.map(({ icon: Icon, label, query: q }) => (
                <button key={label} type="button" onClick={() => send(q)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-violet-100 text-[10px] font-semibold text-violet-700 hover:bg-violet-50 whitespace-nowrap">
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-violet-100 bg-white/90 flex gap-2 items-end">
              <button type="button" className="p-2 text-slate-400 hover:text-violet-600 rounded-lg" title="Attach (UI)"><Paperclip size={18} /></button>
              <button type="button" className="p-2 text-slate-400 hover:text-violet-600 rounded-lg" title="Voice (UI)"><Mic size={18} /></button>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask anything about innovation, teams, AI..."
                rows={1}
                className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-300/40 outline-none max-h-24"
              />
              <button type="button" onClick={() => send()} disabled={loading || !query.trim()}
                className="p-2.5 rounded-xl text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #7C3AED, #6366f1)' }}>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
