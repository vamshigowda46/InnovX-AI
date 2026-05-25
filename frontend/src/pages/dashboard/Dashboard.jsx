import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { StatCard, ProjectCard, LoadingSpinner } from '../../components/ui/Cards'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { FolderKanban, Rocket, Users, Calendar, Trophy, TrendingUp, Zap, Star, Rss, Network, MapPin, Activity, FileText, Award, Sparkles, Target, ShieldCheck, Bot } from 'lucide-react'
import { getInitials, timeAgo } from '../../utils/helpers'
import TiltCard from '../../components/premium/TiltCard'
import PageTransition from '../../components/premium/PageTransition'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [heatmap, setHeatmap] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [career, setCareer] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/analytics'),
      api.get('/dashboard/heatmap'),
      api.get('/dashboard/activity-feed'),
      api.get('/career/overview').catch(() => ({ data: null })),
    ]).then(([s, a, h, act, cr]) => {
      setStats(s.data)
      setAnalytics(a.data)
      setHeatmap(h.data)
      setActivities(act.data.activities || [])
      setCareer(cr.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner size="lg" />

  const growthData = analytics?.growth ? [
    { name: 'Users', value: analytics.growth.new_users_30d },
    { name: 'Projects', value: analytics.growth.new_projects_30d },
    { name: 'Startups', value: analytics.growth.new_startups_30d },
  ] : []

  const mapCenter = heatmap?.innovators?.[0]
    ? [heatmap.innovators[0].lat, heatmap.innovators[0].lng]
    : [12.9716, 77.5946]

  return (
    <PageTransition className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Premium Welcome Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white depth-shadow"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #a855f7 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-violet-300/10 blur-2xl" />
          <svg className="absolute top-0 right-0 w-64 h-64 text-white/5" viewBox="0 0 200 200">
            <path d="M 0 100 Q 50 0 100 100 Q 150 200 200 100" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-indigo-100/80"
              >
                {new Date().getHours() < 12 ? '☀️ Good morning,' : new Date().getHours() < 18 ? '🌤 Good afternoon,' : '🌙 Good evening,'}
              </motion.span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {user?.name?.split(' ')[0]} <span className="text-indigo-200">✨</span>
            </h1>
            <p className="text-indigo-100/80 text-sm mt-0.5 max-w-md">
              Your AI-powered innovation command center — build, collaborate, and launch.
            </p>

            {/* Quick stat badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold border border-white/10"
              >
                <Star size={12} className="text-amber-300" /> {user?.points || 0} pts
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold border border-white/10"
              >
                <Trophy size={12} className="text-amber-300" /> {user?.rank || 'Newcomer'}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold border border-white/10"
              >
                <Zap size={12} className="text-amber-300" /> {user?.innovation_score || 0} score
              </motion.span>
              {stats?.my_stats?.trust_score && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold border border-white/10"
                >
                  <ShieldCheck size={12} className="text-emerald-300" /> {stats.my_stats.trust_score.toFixed(0)}% trust
                </motion.span>
              )}
            </div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2 mt-4"
            >
              <button onClick={() => navigate('/resume')}
                className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-indigo-700 text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all hover:scale-105">
                <FileText size={14} /> Resume
              </button>
              <button onClick={() => navigate('/tools')}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/15 transition-all hover:scale-105">
                <Sparkles size={14} /> AI Tools
              </button>
              <button onClick={() => navigate('/collaboration')}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/15 transition-all hover:scale-105">
                <Network size={14} /> Collaborate
              </button>
              <button onClick={() => navigate('/copilot')}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/15 transition-all hover:scale-105">
                <Bot size={14} /> AI Copilot
              </button>
            </motion.div>
          </div>

          {/* Right side - animated orb */}
          <motion.div
            className="hidden sm:flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl border border-white/20"
              animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Bot size={32} className="text-white/90" />
            </motion.div>
            <span className="text-[10px] text-indigo-200/80 font-medium">AI Assistant</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Career & Productivity */}
      {career && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div role="button" tabIndex={0} onClick={() => navigate('/resume')} onKeyDown={e => e.key === 'Enter' && navigate('/resume')}>
          <TiltCard className="glass-card p-5 cursor-pointer" intensity={5}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center"><FileText className="text-violet-600" size={22} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{career.resume_completion || 0}%</p>
                <p className="text-xs text-slate-500">Resume Complete</p>
              </div>
            </div>
          </TiltCard>
          </div>
          <div role="button" tabIndex={0} onClick={() => navigate('/profile?tab=certificates')} onKeyDown={e => e.key === 'Enter' && navigate('/profile?tab=certificates')}>
          <TiltCard className="glass-card p-5 cursor-pointer" intensity={5}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-100 flex items-center justify-center"><Award className="text-cyan-600" size={22} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{career.certificates_count || 0}</p>
                <p className="text-xs text-slate-500">Certificates</p>
              </div>
            </div>
          </TiltCard>
          </div>
          <TiltCard className="glass-card p-5" intensity={4}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center"><Target className="text-emerald-600" size={22} /></div>
              <div>
                <p className="text-2xl font-black text-slate-900">{career.productivity_score || 0}</p>
                <p className="text-xs text-slate-500">Productivity Score</p>
              </div>
            </div>
          </TiltCard>
          <TiltCard className="glass-card p-5" intensity={4}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><Sparkles className="text-amber-600" size={22} /></div>
              <div>
                <p className="text-sm font-bold text-slate-800 line-clamp-2">AI recommends: finish resume & join a team</p>
                <p className="text-xs text-slate-500 mt-1">Personalized tip</p>
              </div>
            </div>
          </TiltCard>
        </div>
      )}

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={22} />} label="Total Users" value={stats?.platform_stats?.total_users || 0} color="indigo" trend="+12% this month" />
        <StatCard icon={<FolderKanban size={22} />} label="Projects" value={stats?.platform_stats?.total_projects || 0} color="violet" />
        <StatCard icon={<Rocket size={22} />} label="Startups" value={stats?.platform_stats?.total_startups || 0} color="emerald" />
        <StatCard icon={<Calendar size={22} />} label="Events" value={stats?.platform_stats?.total_events || 0} color="amber" />
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-black gradient-text">{stats?.my_stats?.projects || 0}</p>
          <p className="text-xs text-slate-500 mt-1">My Projects</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black gradient-text">{stats?.my_stats?.startups || 0}</p>
          <p className="text-xs text-slate-500 mt-1">My Startups</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{stats?.my_stats?.trust_score?.toFixed(0) || 0}%</p>
          <p className="text-xs text-slate-500 mt-1">Trust Score</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{stats?.my_stats?.innovation_score || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Innovation Score</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View all →</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {stats?.recent_projects?.slice(0, 4).map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Top Innovators */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Top Innovators</h3>
            <div className="space-y-3">
              {stats?.top_innovators?.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5 transition-colors" onClick={() => navigate(`/profile/${u.id}`)}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.avatar ? <img src={u.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /> : getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.innovation_score} score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Analytics */}
          {analytics?.top_skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-indigo-500" /> Top Skills</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={analytics.top_skills.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="skill" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Startups */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Rocket size={16} className="text-violet-500" /> Hot Startups</h3>
            <div className="space-y-3">
              {stats?.recent_startups?.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5" onClick={() => navigate(`/startups/${s.id}`)}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.tagline}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TiltCard className="glass-card p-5 overflow-hidden" intensity={4}>
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-indigo-500" /> Innovation Heatmap
          </h3>
          <div className="h-56 rounded-xl overflow-hidden border border-slate-100">
            <MapContainer center={mapCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              {heatmap?.innovators?.map(p => (
                <CircleMarker key={`i-${p.id}`} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: '#6366f1', fillColor: '#818cf8', fillOpacity: 0.7 }}>
                  <Popup>{p.name} · Score {p.score}</Popup>
                </CircleMarker>
              ))}
              {heatmap?.events?.map(p => (
                <CircleMarker key={`e-${p.id}`} center={[p.lat, p.lng]} radius={6} pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.8 }}>
                  <Popup>{p.name}</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </TiltCard>

        <TiltCard className="glass-card p-5" intensity={4}>
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-violet-500" /> Growth Analytics (30d)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#growthGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </TiltCard>
      </div>

      <TiltCard className="glass-card p-5" intensity={3}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Activity size={18} className="text-emerald-500" /> Real-Time Activity
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activities.slice(0, 6).map((a, i) => (
            <motion.div key={a.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-100/80">
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{a.title}</p>
              <p className="text-xs text-slate-500 mt-1">{a.description}</p>
            </motion.div>
          ))}
        </div>
      </TiltCard>

      {stats?.achievements?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-4">🏆 Recent Achievements</h3>
          <div className="flex flex-wrap gap-3">
            {stats.achievements.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-3 py-2">
                <span className="text-lg">{a.badge_icon || '🏅'}</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">{a.title}</p>
                  <p className="text-xs text-amber-600">+{a.points_awarded} pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  )
}
