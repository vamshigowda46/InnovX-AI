import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { getSkillColor, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Search, Rocket, Users, TrendingUp, X, ArrowRight, Filter, ChevronDown, Heart, Eye } from 'lucide-react'

const DOMAINS = ['FinTech','HealthTech','EdTech','AgriTech','CleanTech','AI/ML','SaaS','E-Commerce','Gaming','Social','Other']
const STAGES = ['idea','mvp','seed','series-a']
const STAGE_CONFIG = {
  idea:     { label:'Idea',     color:'bg-blue-100 text-blue-700',   dot:'bg-blue-500' },
  mvp:      { label:'MVP',      color:'bg-amber-100 text-amber-700', dot:'bg-amber-500' },
  seed:     { label:'Seed',     color:'bg-emerald-100 text-emerald-700', dot:'bg-emerald-500' },
  'series-a':{ label:'Series A', color:'bg-purple-100 text-purple-700', dot:'bg-purple-500' },
}

function StartupCard({ startup, onClick }) {
  const stage = STAGE_CONFIG[startup.stage] || STAGE_CONFIG.idea
  return (
    <div onClick={onClick} className="group bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg hover:border-violet-200 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-sm">
          {startup.logo ? <img src={startup.logo} className="w-12 h-12 rounded-xl object-cover" alt="" /> : startup.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors truncate">{startup.name}</h3>
          <p className="text-xs text-slate-400 truncate mt-0.5">{startup.tagline || startup.domain}</p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${stage.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />{stage.label}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{startup.description || 'No description provided.'}</p>

      {startup.required_skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.required_skills.slice(0, 3).map(s => (
            <span key={s} className={`text-xs font-medium px-2 py-0.5 rounded-lg ${getSkillColor(s)}`}>{s}</span>
          ))}
          {startup.required_skills.length > 3 && <span className="text-xs text-slate-400">+{startup.required_skills.length - 3}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg">{startup.domain}</span>
          <span className="flex items-center gap-1"><Users size={11} />{startup.team_size}</span>
          {startup.funding_goal && <span className="text-emerald-600 font-semibold">${(startup.funding_goal/1000).toFixed(0)}k goal</span>}
        </div>
        <div className="flex items-center gap-2">
          {startup.is_hiring && <span className="bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">Hiring</span>}
          <span>{timeAgo(startup.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', tagline:'', description:'', domain:'', stage:'idea', looking_for:'', required_skills:'', funding_goal:'', location:'', website:'', is_hiring:true })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/startups/', {
        ...form,
        looking_for: form.looking_for.split(',').map(s => s.trim()).filter(Boolean),
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        funding_goal: form.funding_goal ? Number(form.funding_goal) : null,
      })
      toast.success('Startup posted! 🚀')
      onCreated(data.startup)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post startup')
    } finally { setCreating(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Post Your Startup</h2>
            <p className="text-xs text-slate-400 mt-0.5">Find co-founders and team members</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Startup Name *</label>
              <input className="input" placeholder="e.g. InnovX AI" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tagline</label>
              <input className="input" placeholder="One line that captures your vision" value={form.tagline} onChange={e => setForm(p => ({...p, tagline: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What problem are you solving? Who is your target user?" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Domain</label>
              <select className="input" value={form.domain} onChange={e => setForm(p => ({...p, domain: e.target.value}))}>
                <option value="">Select domain</option>
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stage</label>
              <select className="input" value={form.stage} onChange={e => setForm(p => ({...p, stage: e.target.value}))}>
                {STAGES.map(s => <option key={s} value={s} className="capitalize">{STAGE_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Funding Goal ($)</label>
              <input type="number" className="input" placeholder="50000" value={form.funding_goal} onChange={e => setForm(p => ({...p, funding_goal: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
              <input className="input" placeholder="City, Country" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Looking For <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input className="input" placeholder="Co-founder, Developer, Designer, Marketing..." value={form.looking_for} onChange={e => setForm(p => ({...p, looking_for: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input className="input" placeholder="React, Python, Marketing, Finance..." value={form.required_skills} onChange={e => setForm(p => ({...p, required_skills: e.target.value}))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(p => ({...p, is_hiring: !p.is_hiring}))}
              className={`w-10 h-6 rounded-full transition-colors ${form.is_hiring ? 'bg-indigo-500' : 'bg-slate-200'} relative`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_hiring ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Currently hiring</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting...</> : <>Post Startup <Rocket size={15} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Startups() {
  const navigate = useNavigate()
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search:'', domain:'', stage:'' })
  const [showCreate, setShowCreate] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) })
      const { data } = await api.get(`/startups/?${params}`)
      setStartups(data.startups || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      toast.error('Failed to load startups')
      setStartups([])
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchStartups() }, [fetchStartups])

  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Rocket size={24} className="text-violet-600" /> Startup Hub
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} startups building the future</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Post Startup
        </button>
      </div>

      {/* Stage quick filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button onClick={() => { setFilters(p => ({...p, stage:''})); setPage(1) }}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${!filters.stage ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'}`}>
          All Stages
        </button>
        {STAGES.map(s => (
          <button key={s} onClick={() => { setFilters(p => ({...p, stage: p.stage === s ? '' : s})); setPage(1) }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filters.stage === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'}`}>
            {STAGE_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="Search startups..." value={filters.search}
            onChange={e => { setFilters(p => ({...p, search: e.target.value})); setPage(1) }} />
        </div>
        <select className="input py-2.5 text-sm w-auto" value={filters.domain} onChange={e => { setFilters(p => ({...p, domain: e.target.value})); setPage(1) }}>
          <option value="">All Domains</option>
          {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        {activeFilters > 0 && (
          <button onClick={() => { setFilters({ search:'', domain:'', stage:'' }); setPage(1) }}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-3"><div className="w-12 h-12 bg-slate-100 rounded-xl" /><div className="flex-1"><div className="h-4 bg-slate-100 rounded w-3/4 mb-2" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2" /><div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <Rocket size={36} className="text-violet-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No startups found</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            {activeFilters > 0 ? 'Try adjusting your filters' : 'Be the first to post your startup!'}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Post First Startup
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map(s => <StartupCard key={s.id} startup={s} onClick={() => navigate(`/startups/${s.id}`)} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
              <span className="text-sm text-slate-500 px-3">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={(s) => { setShowCreate(false); navigate(`/startups/${s.id}`) }} />}
    </div>
  )
}
