import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import {
  Send, Sparkles, Plus, Trash2, Copy, RefreshCw,
  ChevronDown, Bot, User, Zap, MessageSquare, X
} from 'lucide-react'

// ─── Markdown renderer (no external deps) ────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return ''
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code"><code class="lang-${lang}">${escHtml(code.trim())}</code></pre>`)
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // H2/H3
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote class="md-blockquote">$1</blockquote>')
    // Numbered list
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li-num">$1</li>')
    // Bullet list
    .replace(/^[-•] (.+)$/gm, '<li class="md-li">$1</li>')
    // Wrap consecutive <li> in <ul>/<ol>
    .replace(/(<li class="md-li">[\s\S]*?<\/li>)(\n<li class="md-li">[\s\S]*?<\/li>)*/g,
      m => `<ul class="md-ul">${m}</ul>`)
    .replace(/(<li class="md-li-num">[\s\S]*?<\/li>)(\n<li class="md-li-num">[\s\S]*?<\/li>)*/g,
      m => `<ol class="md-ol">${m}</ol>`)
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="md-hr"/>')
    // Paragraphs (double newline)
    .replace(/\n\n(?!<)/g, '</p><p class="md-p">')
    // Single newlines inside paragraphs
    .replace(/\n(?!<)/g, '<br/>')
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function MarkdownMessage({ content }) {
  const html = renderMarkdown(content)
  return (
    <div
      className="md-body prose-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="md-p">${html}</p>` }}
    />
  )
}

// ─── Typing animation ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  'Give me 3 startup ideas for a CS student',
  'How do I win a 24-hour hackathon?',
  'Build me a 6-month full-stack roadmap',
  'How to write a resume that gets interviews?',
  'What tech stack should I use for my MVP?',
  'How to find a co-founder for my startup?',
]

// ─── Chat storage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = 'innovx_chats'

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveChats(chats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 20))) } catch {}
}

function newChat(firstMessage = '') {
  return {
    id: Date.now().toString(),
    title: firstMessage ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '…' : '') : 'New Chat',
    messages: [],
    createdAt: Date.now(),
  }
}

// ─── Main Copilot Component ───────────────────────────────────────────────────
export default function Copilot() {
  const { user } = useAuth()
  const [chats, setChats] = useState(() => loadChats())
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiStatus, setAiStatus] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  const activeChat = chats.find(c => c.id === activeChatId) || null
  const messages = activeChat?.messages || []

  useEffect(() => {
    api.get('/ai/status').then(r => setAiStatus(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    saveChats(chats)
  }, [chats])

  const createNewChat = useCallback(() => {
    const chat = newChat()
    setChats(prev => [chat, ...prev])
    setActiveChatId(chat.id)
    setInput('')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  const deleteChat = useCallback((chatId, e) => {
    e.stopPropagation()
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (activeChatId === chatId) setActiveChatId(null)
  }, [activeChatId])

  const sendMessage = useCallback(async (messageText) => {
    const text = (messageText || input).trim()
    if (!text || loading) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Create chat if none active
    let chatId = activeChatId
    let isNewChat = false
    if (!chatId) {
      const chat = newChat(text)
      setChats(prev => [chat, ...prev])
      setActiveChatId(chat.id)
      chatId = chat.id
      isNewChat = true
    }

    // Add user message
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setChats(prev => prev.map(c => c.id === chatId
      ? {
          ...c,
          title: isNewChat ? (text.slice(0, 40) + (text.length > 40 ? '…' : '')) : c.title,
          messages: [...c.messages, userMsg]
        }
      : c
    ))

    setLoading(true)

    try {
      // Build history from current chat (exclude the message we just added)
      const currentChat = chats.find(c => c.id === chatId)
      const history = (currentChat?.messages || []).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const { data } = await api.post('/ai/assistant', {
        query: text,
        message: text,
        history,
      })

      const result = data.assistant || {}
      const responseText = result.response || 'I could not generate a response. Please try again.'
      const suggestions = result.suggestions || []

      const assistantMsg = {
        role: 'assistant',
        content: responseText,
        suggestions,
        source: result.source || 'unknown',
        id: Date.now() + 1,
      }

      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, messages: [...c.messages, assistantMsg] }
        : c
      ))
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.'
      toast.error(errMsg)
      const errorMsg = {
        role: 'assistant',
        content: `I encountered an error: ${errMsg}\n\nPlease check your connection and try again.`,
        id: Date.now() + 1,
        isError: true,
      }
      setChats(prev => prev.map(c => c.id === chatId
        ? { ...c, messages: [...c.messages, errorMsg] }
        : c
      ))
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [input, loading, activeChatId, chats])

  const regenerate = useCallback(async () => {
    if (!activeChat || loading) return
    const msgs = activeChat.messages
    // Find last user message
    const lastUserIdx = [...msgs].reverse().findIndex(m => m.role === 'user')
    if (lastUserIdx === -1) return
    const lastUserMsg = msgs[msgs.length - 1 - lastUserIdx]

    // Remove last assistant message if it exists
    const trimmed = msgs[msgs.length - 1]?.role === 'assistant'
      ? msgs.slice(0, -1)
      : msgs

    setChats(prev => prev.map(c => c.id === activeChatId
      ? { ...c, messages: trimmed }
      : c
    ))

    await sendMessage(lastUserMsg.content)
  }, [activeChat, activeChatId, loading, sendMessage])

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied!')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`flex-shrink-0 bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 border-b border-slate-100">
          <button onClick={createNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-600 hover:to-violet-700 transition-all shadow-sm">
            <Plus size={16} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8 px-4">No conversations yet.<br />Start a new chat!</p>
          ) : chats.map(chat => (
            <button key={chat.id} onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl group flex items-center gap-2 transition-all ${activeChatId === chat.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
              <span className="text-sm truncate flex-1">{chat.title}</span>
              <button onClick={(e) => deleteChat(chat.id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0">
                <Trash2 size={13} />
              </button>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className={`w-2 h-2 rounded-full ${aiStatus?.ready ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {aiStatus?.ready ? `${aiStatus.model}` : 'Smart fallback mode'}
          </div>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(p => !p)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
            <MessageSquare size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-none">InnovX Copilot</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {aiStatus?.ready ? `Powered by ${aiStatus.model}` : 'AI Assistant'}
              </p>
            </div>
          </div>
          {activeChat && (
            <span className="ml-2 text-sm text-slate-500 truncate hidden sm:block">{activeChat.title}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={regenerate} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40">
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-5 shadow-lg">
                <Sparkles size={30} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">InnovX Copilot</h2>
              <p className="text-slate-500 text-sm mb-8 max-w-md">
                Your AI-powered assistant for startups, hackathons, career growth, and innovation.
                Ask me anything.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 w-full max-w-xl">
                {DEFAULT_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm text-slate-700 font-medium shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id || idx}
                  msg={msg}
                  user={user}
                  onCopy={copyMessage}
                  onSuggestion={sendMessage}
                  isLast={idx === messages.length - 1}
                />
              ))}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-100 p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask InnovX Copilot anything… (Enter to send, Shift+Enter for new line)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: '160px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              InnovX Copilot can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, user, onCopy, onSuggestion, isLast }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div className="max-w-[80%] bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold text-xs">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border ${msg.isError ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
          <MarkdownMessage content={msg.content} />
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 mt-2 ml-1">
          <button onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
          </button>
          {msg.source && (
            <span className="text-xs text-slate-300">
              · {msg.source === 'gemini' ? `✨ ${msg.source}` : '🔧 fallback'}
            </span>
          )}
        </div>

        {/* Suggestion chips */}
        {isLast && msg.suggestions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {msg.suggestions.map((s, i) => (
              <button key={i} onClick={() => onSuggestion(s)}
                className="text-xs px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all font-medium shadow-sm">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
