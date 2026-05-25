import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { getInitials, timeAgo } from '../../utils/helpers'
import {
  Send, Search, MessageSquare, ChevronLeft, Check, CheckCheck,
  User, Phone, MoreVertical, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function Messages() {
  const { user, socket } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileList, setShowMobileList] = useState(true)

  const messagesEndRef = useRef(null)
  const typingTimeout = useRef(null)
  const convCache = useRef({})

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations')
      setConversations(data.conversations || [])
    } catch {
      // silent
    }
  }, [])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  useEffect(() => {
    if (!socket) return

    const onNewMsg = (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.temp_id === msg.temp_id || m.id === msg.id)) return prev
        if (selectedUser && (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id)) {
          convCache.current[`${msg.sender_id}-${msg.receiver_id}`] = true
          return [...prev, { ...msg, status: 'sent' }]
        }
        return prev
      })
      fetchConversations()
    }

    const onTyping = () => setTyping(true)
    const onStopTyping = () => setTyping(false)

    socket.on('new_message', onNewMsg)
    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)

    return () => {
      socket.off('new_message', onNewMsg)
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
    }
  }, [socket, selectedUser, fetchConversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConversation = async (conv) => {
    setSelectedUser(conv.user)
    setShowMobileList(false)
    setMessages([])
    setLoading(true)
    setTyping(false)
    try {
      const { data } = await api.get(`/messages/${conv.user.id}`)
      setMessages((data.messages || []).map(m => ({ ...m, status: 'sent' })))
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser || sending) return
    const content = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const optimistic = {
      id: tempId,
      temp_id: tempId,
      sender_id: user?.id,
      receiver_id: selectedUser.id,
      content,
      message_type: 'text',
      is_read: false,
      status: 'sending',
      created_at: new Date().toISOString(),
    }
    setNewMessage('')
    setSending(true)
    setMessages(prev => [...prev, optimistic])

    try {
      if (socket && socket.connected) {
        socket.emit('send_message', { receiver_id: selectedUser.id, content, temp_id: tempId })
        setMessages(prev =>
          prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m)
        )
      } else {
        const { data } = await api.post('/messages/send', { receiver_id: selectedUser.id, content })
        setMessages(prev =>
          prev.map(m => m.id === tempId ? { ...data.message, status: 'sent' } : m)
        )
        fetchConversations()
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)
      )
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    if (socket && socket.connected && selectedUser) {
      socket.emit('typing', { receiver_id: selectedUser.id })
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(
        () => socket.emit('stop_typing', { receiver_id: selectedUser.id }),
        1500
      )
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="flex h-[calc(100vh-65px)] relative">
      {/* Mobile back overlay */}
      <AnimatePresence>
        {!showMobileList && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
            onClick={() => setShowMobileList(true)}
          />
        )}
      </AnimatePresence>

      {/* Conversations sidebar */}
      <motion.div
        animate={{ x: 0 }}
        className={`absolute lg:relative z-20 inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex flex-col flex-shrink-0 transition-all duration-300 ${
          showMobileList ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Messages</h2>
              <p className="text-xs text-slate-400 mt-0.5">{conversations.length} conversations</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name ? getInitials(user.name) : <User size={16} />}
            </div>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50/80 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/40 focus:bg-white transition-all placeholder-slate-400"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <AnimatePresence>
            {filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center p-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[200px]">
                  Connect with collaborators from the Collaboration hub to start chatting
                </p>
              </motion.div>
            ) : (
              filteredConversations.map((conv, i) => (
                <motion.button
                  key={conv.user.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50/40 transition-all border-b border-slate-50/80 ${
                    selectedUser?.id === conv.user.id
                      ? 'bg-gradient-to-r from-indigo-50/80 to-violet-50/40 border-l-2 border-l-indigo-500'
                      : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {conv.user.avatar ? (
                        <img src={conv.user.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                      ) : getInitials(conv.user.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 truncate">{conv.user.name}</p>
                      <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                        {timeAgo(conv.last_message?.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-400 truncate pr-2">{conv.last_message?.content || 'Start chatting'}</p>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50/80 to-white min-w-0">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowMobileList(true)}
                className="lg:hidden p-1 -ml-1 text-slate-400 hover:text-slate-600"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : getInitials(selectedUser.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{selectedUser.name}</p>
                <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                  Online
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <Phone size={16} />
                </button>
                <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} w-full`}>
                      <div className={`h-10 rounded-2xl skeleton-shimmer ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <MessageSquare size={28} className="text-indigo-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-600">Start a conversation</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                    Say hello to {selectedUser.name} and start collaborating!
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id
                    return (
                      <motion.div
                        key={msg.id || msg.temp_id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`relative max-w-[80%] sm:max-w-[70%] lg:max-w-[55%] px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-indigo-200/30'
                              : 'bg-white text-slate-800 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100/80'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {timeAgo(msg.created_at)}
                            </span>
                            {isMine && (
                              <span className="flex">
                                {msg.status === 'sending' ? (
                                  <Check size={12} className="text-indigo-200" />
                                ) : msg.status === 'failed' ? (
                                  <span className="text-red-300 text-[10px]">!</span>
                                ) : (
                                  <CheckCheck size={12} className="text-indigo-200" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}

              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100/80">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={sendMessage}
              className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 p-4 flex gap-3 items-end"
            >
              <div className="flex-1 relative">
                <input
                  className="w-full px-4 py-3 pr-10 text-sm bg-slate-50/80 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300/40 focus:bg-white transition-all placeholder-slate-400"
                  placeholder={`Message ${selectedUser?.name?.split(' ')[0] || '...'}`}
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e)}
                />
              </div>
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sending}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-200/30 hover:shadow-xl hover:shadow-indigo-200/40 transition-all"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-5 border border-indigo-100/50">
              <MessageSquare size={32} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Select a conversation</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Choose a conversation from the sidebar or start a new one with a collaborator
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
