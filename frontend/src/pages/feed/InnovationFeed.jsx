import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api, { getAiErrorMessage } from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getInitials, timeAgo } from '../../utils/helpers'
import TiltCard from '../../components/premium/TiltCard'
import PageTransition from '../../components/premium/PageTransition'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import {
  Heart, Bookmark, MessageCircle, Share2, Sparkles, TrendingUp,
  Rocket, Users, Zap, Flame, Send, ChevronDown
} from 'lucide-react'

const POST_ICONS = {
  idea: '💡', project: '🛠️', startup: '🚀', hackathon: '🏆',
  collab: '🤝', tech: '⚡', mentor: '🎓', ai_opportunity: '✨',
  recruitment: '👥', innovation: '🌟',
}

const REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Like' },
  { id: 'love', emoji: '❤️', label: 'Love' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'insight', emoji: '💡', label: 'Insight' },
]

const TABS = [
  { id: 'for_you', label: 'For You', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'following', label: 'Following', icon: Users },
]

export default function InnovationFeed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [tab, setTab] = useState('for_you')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [trending, setTrending] = useState([])
  const [innovators, setInnovators] = useState([])
  const [daily, setDaily] = useState([])
  const [expandedComments, setExpandedComments] = useState({})
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const fetchPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page
    if (reset) setLoading(true)
    try {
      const { data } = await api.get(`/feed/posts?type=${tab}&page=${p}&per_page=8`)
      setPosts(prev => reset ? data.posts : [...prev, ...data.posts])
      setHasMore(data.has_more)
      if (!reset) setPage(p + 1)
      else setPage(2)
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => {
    setPage(1)
    fetchPosts(true)
    api.get('/feed/trending').then(r => setTrending(r.data.posts || [])).catch(() => {})
    api.get('/feed/top-innovators').then(r => setInnovators(r.data.innovators || [])).catch(() => {})
    api.get('/feed/daily-suggestions').then(r => setDaily(r.data.suggestions || [])).catch(() => {})
  }, [tab])

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) fetchPosts(false)
    }, { threshold: 0.1 })
    if (loadMoreRef.current) obs.observe(loadMoreRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, fetchPosts])

  const toggleLike = async (post) => {
    try {
      const { data } = await api.post(`/feed/posts/${post.id}/like`)
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, liked: data.liked, likes_count: data.likes_count }
        : p))
    } catch { toast.error('Action failed') }
  }

  const toggleSave = async (post) => {
    try {
      const { data } = await api.post(`/feed/posts/${post.id}/save`)
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, saved: data.saved } : p))
      toast.success(data.saved ? 'Saved!' : 'Removed from saved')
    } catch { toast.error('Save failed') }
  }

  const react = async (post, reaction) => {
    try {
      await api.post(`/feed/posts/${post.id}/react`, { reaction })
      setPosts(prev => prev.map(p => p.id === post.id
        ? { ...p, user_reaction: reaction, liked: true, likes_count: p.likes_count + (p.user_reaction ? 0 : 1) }
        : p))
    } catch {}
  }

  const share = async (post) => {
    await api.post(`/feed/posts/${post.id}/share`).catch(() => {})
    navigator.clipboard?.writeText(`${window.location.origin}/feed?post=${post.id}`)
    toast.success('Link copied!')
  }

  const loadComments = async (postId) => {
    if (comments[postId]) {
      setExpandedComments(e => ({ ...e, [postId]: !e[postId] }))
      return
    }
    const { data } = await api.get(`/feed/posts/${postId}/comments`)
    setComments(c => ({ ...c, [postId]: data.comments }))
    setExpandedComments(e => ({ ...e, [postId]: true }))
  }

  const addComment = async (postId) => {
    const text = commentText[postId]?.trim()
    if (!text) return
    try {
      const { data } = await api.post(`/feed/posts/${postId}/comments`, { content: text })
      setComments(c => ({ ...c, [postId]: [data.comment, ...(c[postId] || [])] }))
      setCommentText(t => ({ ...t, [postId]: '' }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    } catch { toast.error('Comment failed') }
  }

  return (
    <PageTransition className="relative min-h-full premium-bg">
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black gradient-text tracking-tight">Innovation Feed</h1>
            <p className="text-slate-400 mt-1">AI-personalized ecosystem · Ideas · Projects · Collaborations</p>
          </div>
          <div className="flex gap-2 glass-premium p-1.5 rounded-2xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`feed-tab flex items-center gap-2 ${tab === id ? 'active' : ''}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-5">
            {loading && posts.length === 0 ? (
              <SkeletonGrid count={4} />
            ) : (
              <AnimatePresence>
                {posts.map((post, idx) => (
                  <TiltCard key={post.id} className="glass-card depth-shadow overflow-hidden" intensity={6}>
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {post.author?.avatar
                            ? <img src={post.author.avatar} className="w-11 h-11 rounded-xl object-cover" alt="" />
                            : getInitials(post.author?.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800">{post.author?.name}</span>
                            <span className="text-lg">{POST_ICONS[post.post_type] || '🌟'}</span>
                            {post.is_trending && (
                              <span className="badge badge-warning flex items-center gap-1">
                                <Flame size={10} /> Trending
                              </span>
                            )}
                            {post.is_ai_generated && (
                              <span className="badge badge-purple flex items-center gap-1">
                                <Sparkles size={10} /> AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{post.category} · {timeAgo(post.created_at)}</p>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-2">{post.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{post.content}</p>

                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {post.tags.map(t => (
                            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">#{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1 pt-3 border-t border-slate-100/80">
                        <button onClick={() => toggleLike(post)}
                          className={`reaction-btn ${post.liked ? 'active' : ''}`}>
                          <Heart size={16} className={post.liked ? 'fill-red-500 text-red-500' : ''} />
                          {post.likes_count}
                        </button>
                        <button onClick={() => loadComments(post.id)} className="reaction-btn">
                          <MessageCircle size={16} /> {post.comments_count}
                        </button>
                        <button onClick={() => toggleSave(post)} className={`reaction-btn ${post.saved ? 'active' : ''}`}>
                          <Bookmark size={16} className={post.saved ? 'fill-indigo-500 text-indigo-500' : ''} />
                        </button>
                        <button onClick={() => share(post)} className="reaction-btn">
                          <Share2 size={16} /> {post.shares_count || 0}
                        </button>
                        <div className="ml-auto flex gap-0.5">
                          {REACTIONS.map(r => (
                            <button key={r.id} onClick={() => react(post, r.id)} title={r.label}
                              className={`w-8 h-8 rounded-full text-sm hover:scale-125 transition-transform ${post.user_reaction === r.id ? 'bg-indigo-100 scale-110' : 'hover:bg-slate-100'}`}>
                              {r.emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {expandedComments[post.id] && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                          {(comments[post.id] || []).map(c => (
                            <div key={c.id} className="flex gap-2 text-sm">
                              <span className="font-semibold text-slate-800">{c.user?.name}:</span>
                              <span className="text-slate-600">{c.content}</span>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <input
                              value={commentText[post.id] || ''}
                              onChange={e => setCommentText(t => ({ ...t, [post.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && addComment(post.id)}
                              placeholder="Add a comment..."
                              className="input flex-1 py-2 text-sm"
                            />
                            <button onClick={() => addComment(post.id)} className="btn-3d p-2">
                              <Send size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </TiltCard>
                ))}
              </AnimatePresence>
            )}
            <div ref={loadMoreRef} className="h-8 flex justify-center">
              {hasMore && !loading && <ChevronDown className="text-slate-400 animate-bounce" />}
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-5">
            <motion.div className="glass-card p-5 gradient-border" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-indigo-500" /> AI For You
              </h3>
              <div className="space-y-3">
                {daily.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.category}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-amber-500" /> Trending
              </h3>
              {trending.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-black text-indigo-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.likes_count} likes</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Rocket size={18} className="text-violet-500" /> Top Innovators
              </h3>
              {innovators.slice(0, 5).map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 py-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.innovation_score} score</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-5 bg-gradient-to-br from-indigo-500/5 to-violet-500/10">
              <Zap className="text-indigo-500 mb-2" size={24} />
              <p className="text-sm font-semibold text-slate-800">Your innovation profile</p>
              <p className="text-2xl font-black gradient-text mt-1">{user?.innovation_score || 0}</p>
              <p className="text-xs text-slate-500 mt-1">AI score from projects & collabs</p>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
