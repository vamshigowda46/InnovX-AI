import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials, timeAgo } from '../../utils/helpers'
import api from '../../utils/api'
import { io } from 'socket.io-client'
import ParticleBackground from '../premium/ParticleBackground'
import PremiumAssistant from '../premium/PremiumAssistant'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FolderKanban, Rocket, Brain, Calendar,
  MessageSquare, Trophy, MapPin, Search, Bell, LogOut, ChevronDown,
  Menu, X, Sparkles, Shield, Rss, Network, FileText, Award, BarChart3,
  PanelLeftClose, PanelLeft, Bot
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/copilot', icon: Bot, label: 'AI Copilot', highlight: true },
  { path: '/tools', icon: Sparkles, label: 'AI Tools' },
  { path: '/resume', icon: FileText, label: 'Resume Builder' },
  { path: '/collaboration', icon: Network, label: 'Collaboration' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/feed', icon: Rss, label: 'Innovation Feed' },
  { path: '/startups', icon: Rocket, label: 'Startups' },
  { path: '/team-match', icon: Users, label: 'Team Match' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/mentors', icon: Brain, label: 'Mentors' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/nearby', icon: MapPin, label: 'Nearby' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)

  useEffect(() => {
    fetchNotifications()
    const token = localStorage.getItem('access_token')
    if (!token) return
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
    const socket = io(socketUrl, { auth: { token }, transports: ['websocket', 'polling'] })
    socket.on('notification', (n) => {
      setNotifications(prev => [n, ...prev])
      setUnreadCount(c => c + 1)
    })
    return () => socket.disconnect()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/messages/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/messages/notifications/read-all')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults(null); return }
    try {
      const { data } = await api.get(`/dashboard/search?q=${encodeURIComponent(q)}`)
      setSearchResults(data.results)
    } catch {}
  }

  return (
    <div className="flex h-screen premium-bg overflow-hidden relative">
      <ParticleBackground density={28} light />

      <aside className={`fixed inset-y-0 left-0 z-50 glass-premium flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:flex depth-shadow ${collapsed ? 'w-[72px]' : 'w-64'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/60">
          <motion.div
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200/50"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <span className="text-white font-black text-sm">IX</span>
          </motion.div>
          {!collapsed && (
            <div>
              <span className="font-black text-slate-800 text-lg tracking-tight">InnovX</span>
              <span className="block text-[10px] text-violet-600 font-bold uppercase tracking-widest">AI Platform</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex ml-auto text-slate-400 hover:text-violet-600 p-1">
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 ml-auto">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ path, icon: Icon, label, tab, highlight }) => (
            <Link
              key={path + label}
              to={tab ? `${path}?tab=${tab}` : path}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? label : undefined}
              className={`sidebar-link ${
                location.pathname === path || location.pathname.startsWith(path + '/') ? 'active' : ''
              } ${collapsed ? 'justify-center px-2' : ''} ${
                highlight ? 'bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100' : ''
              }`}
            >
              <Icon size={18} className={highlight ? 'text-indigo-600' : ''} />
              {!collapsed && (
                <span className={`text-sm ${highlight ? 'font-bold text-indigo-700' : ''}`}>
                  {label}
                  {highlight && <span className="ml-1.5 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-200/50">
            <Link to="/profile" onClick={() => setSidebarOpen(false)} title="Profile"
              className={`sidebar-link ${location.pathname.startsWith('/profile') && !location.search.includes('certificates') ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}>
              <Shield size={18} />
              {!collapsed && <span className="text-sm">Profile</span>}
            </Link>
            <Link to="/dashboard" onClick={() => setSidebarOpen(false)} title="Analytics"
              className={`sidebar-link ${collapsed ? 'justify-center' : ''}`}>
              <BarChart3 size={18} />
              {!collapsed && <span className="text-sm">Analytics</span>}
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-white/60">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.avatar ? <img src={user.avatar} className="w-9 h-9 rounded-xl object-cover" alt="" /> : getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-violet-600 font-medium truncate">{user?.rank}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="glass-premium px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0 border-b border-white/50">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500">
            <Menu size={22} />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search ecosystem..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/60 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300/40 focus:bg-white transition-all"
            />
            {searchResults && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-2 left-0 right-0 glass-premium rounded-2xl z-50 max-h-80 overflow-y-auto depth-shadow">
                {Object.entries(searchResults).map(([type, items]) =>
                  items?.length > 0 && (
                    <div key={type} className="p-2">
                      <p className="text-xs font-bold text-slate-400 uppercase px-2 py-1">{type}</p>
                      {items.map(item => (
                        <button key={item.id} onClick={() => {
                          navigate(`/${type === 'users' ? 'profile' : type}/${item.id}`)
                          setSearchQuery(''); setSearchResults(null)
                        }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50/50 text-sm text-slate-700">
                          {item.name || item.title}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false) }}
              className="relative p-2.5 rounded-xl hover:bg-white/70 text-slate-500 transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            <div className="relative">
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false) }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/70">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(user?.name)}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-premium rounded-xl z-50 py-1 depth-shadow">
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/50">Profile</Link>
                  <Link to="/feed" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/50">Feed</Link>
                  <hr className="my-1 border-slate-100" />
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 w-full text-left">Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      {/* Notification panel - rendered at root level to avoid overflow clipping */}
      <AnimatePresence>
        {showNotifs && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-sm"
              onClick={() => setShowNotifs(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="fixed top-4 right-4 z-[110] w-80 sm:w-96 glass-premium rounded-2xl depth-shadow max-h-[calc(100vh-2rem)] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <div>
                  <span className="font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 text-[11px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">All caught up</p>
                    <p className="text-xs text-slate-400 mt-1">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`px-5 py-3.5 border-b border-slate-50/80 transition-colors ${
                        !n.is_read ? 'bg-gradient-to-r from-indigo-50/60 to-transparent' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          n.type === 'message' ? 'bg-indigo-100 text-indigo-600' :
                          n.type === 'team_invite' ? 'bg-emerald-100 text-emerald-600' :
                          n.type === 'collab_accepted' ? 'bg-violet-100 text-violet-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <Bell size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PremiumAssistant />
    </div>
  )
}
