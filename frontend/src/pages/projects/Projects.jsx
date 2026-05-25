import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { getSkillColor, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Plus, Search, Filter, FolderKanban, Users, Zap, Eye, Heart, ArrowRight, X, ChevronDown } from 'lucide-react'

const DOMAINS = ['Web Development','Mobile App','AI/ML','IoT','Blockchain','Data Science','Cybersecurity','Game Dev','AR/VR','FinTech','HealthTech','EdTech']
const DIFFICULTIES = ['beginner','intermediate','advanced']
const STATUSES = ['active','completed','paused']

function ProjectCard({ project, onClick }) {
  const statusStyle = { active:'bg-emerald-100 text-emerald-700', completed:'bg-blue-100 text-blue-700', paused:'bg-amber-100 text-amber-700' }
  const diffStyle = { beginner:'bg-green-100 text-green-700', intermediate:'bg-yellow-100 text-yellow-700', advanced:'bg-red-100 text-red-700' }
  return (
    <div onClick={onClick} className="group bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate text-base">{project.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{project.domain || 'General'}</p>
        </div>
        <div className="flex flex-col gap-1 items-end flex-shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle[project.status] || statusStyle.active}`}>{project.status}</span>
          {project.difficulty && <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${diffStyle[project.difficulty] || ''}`}>{project.difficulty}</span>}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">{project.description || 'No description provided.'}</p>

      {/* Tech stack */}
      {project.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tech_stack.slice(0, 4).map(t => (
            <span key={t} className={`text-xs font-medium px-2 py-0.5 rounded-lg ${getSkillColor(t)}`}>{t}</span>
          ))}
          {project.tech_stack.length > 4 && <span className="text-xs text-slate-400 px-2 py-0.5">+{project.tech_stack.length - 4}</span>}
        </div>
      )}

      {/* Progress bar */}
      {project.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span className="font-semibold text-slate-600">{project.progress}%</span></div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><Users size={11} />{project.team_size}</span>
          <span className="flex items-center gap-1"><Eye size={11} />{project.views || 0}</span>
          {project.ai_generated && <span className="flex items-center gap-1 text-violet-500 font-medium"><Zap size={11} />AI</span>}
        </div>
        <div className="flex items-center gap-2">
          {project.looking_for_members && <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">Hiring</span>}
          <span className="text-xs text-slate-300">{timeAgo(project.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title:'', description:'', domain:'', difficulty:'intermediate', tech_stack:'', required_skills:'', looking_for_members:true, github_url:'' })
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { data } = await api.post('/projects/', {
        ...form,
        tech_stack: form.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
        required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
      })
      toast.success('Project created! 🚀')
      onCreated(data.project)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally { setCreating(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Create New Project</h2>
            <p className="text-xs text-slate-400 mt-0.5">Share your idea with the community</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Title *</label>
            <input className="input" placeholder="e.g. AI Study Buddy" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What problem does this solve?" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
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
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={e => setForm(p => ({...p, difficulty: e.target.value}))}>
                {DIFFICULTIES.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tech Stack <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input className="input" placeholder="React, Python, PostgreSQL, Docker..." value={form.tech_stack} onChange={e => setForm(p => ({...p, tech_stack: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Required Skills <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input className="input" placeholder="JavaScript, Machine Learning, UI/UX..." value={form.required_skills} onChange={e => setForm(p => ({...p, required_skills: e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">GitHub URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="input" placeholder="https://github.com/..." value={form.github_url} onChange={e => setForm(p => ({...p, github_url: e.target.value}))} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setForm(p => ({...p, looking_for_members: !p.looking_for_members}))}
              className={`w-10 h-6 rounded-full transition-colors ${form.looking_for_members ? 'bg-indigo-500' : 'bg-slate-200'} relative`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.looking_for_members ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-slate-700">Looking for team members</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : <>Create Project <ArrowRight size={15} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ search:'', domain:'', status:'' })
  const [showCreate, setShowCreate] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) })
      const { data } = await api.get(`/projects/?${params}`)
      setProjects(data.projects || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch (err) {
      toast.error('Failed to load projects')
      setProjects([])
    } finally { setLoading(false) }
  }, [page, filters])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleCreated = (project) => {
    setShowCreate(false)
    navigate(`/projects/${project.id}`)
  }

  const activeFilters = Object.values(filters).filter(Boolean).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FolderKanban size={24} className="text-indigo-600" /> Projects
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} projects in the ecosystem</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
            placeholder="Search projects..." value={filters.search}
            onChange={e => { setFilters(p => ({...p, search: e.target.value})); setPage(1) }} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFilters > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}`}>
          <Filter size={14} /> Filters {activeFilters > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilters}</span>}
          <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        {activeFilters > 0 && (
          <button onClick={() => { setFilters({ search:'', domain:'', status:'' }); setPage(1) }}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 shadow-sm animate-slide-up">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Domain</label>
            <select className="input py-2 text-sm" value={filters.domain} onChange={e => { setFilters(p => ({...p, domain: e.target.value})); setPage(1) }}>
              <option value="">All Domains</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status</label>
            <select className="input py-2 text-sm" value={filters.status} onChange={e => { setFilters(p => ({...p, status: e.target.value})); setPage(1) }}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
              <div className="flex gap-2"><div className="h-6 bg-slate-100 rounded-lg w-16" /><div className="h-6 bg-slate-100 rounded-lg w-20" /></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <FolderKanban size={36} className="text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No projects found</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            {activeFilters > 0 ? 'Try adjusting your filters' : 'Be the first to create a project!'}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Create First Project
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const p = i + 1
                  return <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${page === p ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
                })}
              </div>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  )
}
