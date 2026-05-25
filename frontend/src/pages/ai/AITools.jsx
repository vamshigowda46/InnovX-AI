import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import api, { getAiErrorMessage } from '../../utils/api'
import toast from 'react-hot-toast'
import { Sparkles, Lightbulb, BookOpen, FileText, Shield, Brain, ChevronRight, Loader } from 'lucide-react'

const DOMAINS = ['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Blockchain', 'Data Science', 'Cybersecurity', 'Game Dev', 'AR/VR', 'FinTech', 'HealthTech', 'EdTech']
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const TECH_STACKS = ['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring', 'Go', 'Rust', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'TensorFlow', 'PyTorch']

const TOOLS = [
  { id: 'ideas', icon: '💡', label: 'Project Idea Generator', desc: 'Generate AI-powered project ideas', category: 'create', uses: '2.4k' },
  { id: 'skills', icon: '🧠', label: 'Skill Analyzer', desc: 'Analyze your skills and get recommendations', category: 'analyze', uses: '1.8k' },
  { id: 'resume', icon: '📄', label: 'Resume Builder', desc: 'Generate professional resume content', category: 'create', uses: '3.1k' },
  { id: 'roadmap', icon: '🗺️', label: 'Learning Roadmap', desc: 'Get a personalized learning path', category: 'plan', uses: '1.2k' },
  { id: 'verify', icon: '🛡️', label: 'Profile Verifier', desc: 'Check your profile trust score', category: 'analyze', uses: '890' },
  { id: 'startup', icon: '🚀', label: 'Startup Predictor', desc: 'AI success probability & risk analysis', category: 'analyze', uses: '760' },
  { id: 'score', icon: '⚡', label: 'Innovation Score', desc: 'AI innovation score from your activity', category: 'analyze', uses: '1.5k' },
  { id: 'skillverify', icon: '✅', label: 'Skill Verification', desc: 'Verify skills & GitHub authenticity', category: 'analyze', uses: '640' },
]

const CATEGORIES = [
  { id: 'all', label: 'All Tools' },
  { id: 'create', label: 'Create' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'plan', label: 'Plan' },
]

export default function AITools() {
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState('ideas')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [aiStatus, setAiStatus] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [view, setView] = useState('grid')

  const [ideaForm, setIdeaForm] = useState({ domain: '', difficulty: 'intermediate', tech_stack: [] })
  const [roadmapForm, setRoadmapForm] = useState({ career_goal: '', timeline_months: 6 })
  const [startupForm, setStartupForm] = useState({ name: '', stage: 'mvp', domain: 'FinTech', team_size: 2 })

  useEffect(() => {
    api.get('/ai/status').then(r => setAiStatus(r.data)).catch(() => {})
  }, [])

  const filteredTools = useMemo(() => {
    return TOOLS.filter(t => {
      const matchCat = category === 'all' || t.category === category
      const q = search.toLowerCase()
      const matchSearch = !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, category])

  const toggleTech = (tech) => {
    setIdeaForm(p => ({
      ...p,
      tech_stack: p.tech_stack.includes(tech) ? p.tech_stack.filter(t => t !== tech) : [...p.tech_stack, tech]
    }))
  }

  const generateIdeas = async () => {
    if (!ideaForm.domain) { toast.error('Select a domain'); return }
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/generate-ideas', ideaForm)
      setResult({ type: 'ideas', data: data.ideas })
    } catch (err) {
      toast.error(getAiErrorMessage(err))
    }
    finally { setLoading(false) }
  }

  const analyzeSkills = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/analyze-skills', {})
      setResult({ type: 'skills', data: data.analysis })
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  const generateResume = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/generate-resume', {})
      setResult({ type: 'resume', data: data.resume_content })
    } catch { toast.error('Resume generation failed') }
    finally { setLoading(false) }
  }

  const generateRoadmap = async () => {
    if (!roadmapForm.career_goal) { toast.error('Enter a career goal'); return }
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/learning-roadmap', roadmapForm)
      setResult({ type: 'roadmap', data: data.roadmap })
    } catch { toast.error('Roadmap generation failed') }
    finally { setLoading(false) }
  }

  const verifyProfile = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/verify-profile', {})
      setResult({ type: 'verify', data: data.verification })
    } catch { toast.error('Verification failed') }
    finally { setLoading(false) }
  }

  const predictStartup = async () => {
    if (!startupForm.name) { toast.error('Enter startup name'); return }
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/startup-predictor', startupForm)
      setResult({ type: 'startup', data: data.prediction })
    } catch { toast.error('Prediction failed') }
    finally { setLoading(false) }
  }

  const fetchInnovationScore = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await api.get('/ai/innovation-score')
      setResult({ type: 'score', data })
    } catch { toast.error('Score fetch failed') }
    finally { setLoading(false) }
  }

  const verifySkills = async () => {
    setLoading(true); setResult(null)
    try {
      const { data } = await api.post('/ai/skill-verification', {})
      setResult({ type: 'skillverify', data: data.verification })
    } catch { toast.error('Verification failed') }
    finally { setLoading(false) }
  }

  const handleRun = () => {
    const actions = {
      ideas: generateIdeas, skills: analyzeSkills, resume: generateResume,
      roadmap: generateRoadmap, verify: verifyProfile, startup: predictStartup,
      score: fetchInnovationScore, skillverify: verifySkills,
    }
    actions[activeTool]?.()
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto premium-bg min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text flex items-center gap-2">
          <Sparkles size={28} className="text-violet-600" /> AI Tools
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Powered by Google Gemini
          {aiStatus?.ready && <span className="text-emerald-600 ml-2 font-medium">● {aiStatus.model} live</span>}
          {aiStatus && !aiStatus.ready && <span className="text-amber-600 ml-2 font-medium">● Smart fallbacks active</span>}
        </p>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="search"
          placeholder="Search AI tools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1 max-w-md"
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`feed-tab ${category === c.id ? 'active' : ''}`}>{c.label}</button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setView('grid')} className={`px-3 py-2 rounded-lg text-sm font-medium ${view === 'grid' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}>Grid</button>
          <button onClick={() => setView('workspace')} className={`px-3 py-2 rounded-lg text-sm font-medium ${view === 'workspace' ? 'bg-violet-100 text-violet-700' : 'text-slate-500'}`}>Workspace</button>
        </div>
      </div>

      {view === 'grid' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {filteredTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setView('workspace'); setResult(null) }}
              className="tool-card-glow text-left group"
            >
              <span className="text-3xl">{tool.icon}</span>
              <h3 className="font-bold text-slate-800 mt-3 group-hover:text-violet-700 transition-colors">{tool.label}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tool.desc}</p>
              <p className="text-xs text-violet-600 font-semibold mt-3">{tool.uses} uses</p>
              <span className="inline-flex mt-3 text-sm font-semibold text-violet-600 items-center gap-1">
                Launch <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={view === 'workspace' ? 'grid lg:grid-cols-4 gap-6' : 'hidden'}>
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {filteredTools.map(tool => (
            <button key={tool.id} onClick={() => { setActiveTool(tool.id); setResult(null) }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${activeTool === tool.id ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white border-slate-100 hover:border-violet-100'}`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${activeTool === tool.id ? 'text-violet-700' : 'text-slate-700'}`}>{tool.label}</p>
                  <p className="text-xs text-slate-400 truncate">{tool.desc}</p>
                </div>
                {activeTool === tool.id && <ChevronRight size={14} className="text-violet-500 flex-shrink-0" />}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="card p-6">
            {activeTool === 'ideas' && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-800 text-lg">💡 Project Idea Generator</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Domain *</label>
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map(d => (
                      <button key={d} onClick={() => setIdeaForm(p => ({ ...p, domain: d }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${ideaForm.domain === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {DIFFICULTIES.map(d => (
                      <button key={d} onClick={() => setIdeaForm(p => ({ ...p, difficulty: d }))}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-all ${ideaForm.difficulty === d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tech Stack (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {TECH_STACKS.map(t => (
                      <button key={t} onClick={() => toggleTech(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${ideaForm.tech_stack.includes(t) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'skills' && (
              <div>
                <h2 className="font-bold text-slate-800 text-lg mb-3">🧠 Skill Analyzer</h2>
                <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-indigo-700 font-medium">Your current skills:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user?.skills?.length > 0 ? user.skills.map(s => (
                      <span key={s} className="badge badge-primary">{s}</span>
                    )) : <p className="text-sm text-slate-400">No skills added yet. Update your profile first.</p>}
                  </div>
                </div>
                <p className="text-sm text-slate-600">AI will analyze your skills and provide personalized recommendations for internships, hackathons, and skill improvements.</p>
              </div>
            )}

            {activeTool === 'resume' && (
              <div>
                <h2 className="font-bold text-slate-800 text-lg mb-3">📄 AI Resume Builder</h2>
                <div className="bg-indigo-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-indigo-700">Generating resume for: <strong>{user?.name}</strong></p>
                  <p className="text-xs text-indigo-500 mt-1">{user?.department} • {user?.university}</p>
                </div>
                <p className="text-sm text-slate-600">AI will generate a professional summary, objective, and project descriptions based on your profile.</p>
              </div>
            )}

            {activeTool === 'roadmap' && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-800 text-lg">🗺️ Learning Roadmap Generator</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Career Goal *</label>
                  <input className="input" placeholder="e.g., Full Stack Developer, ML Engineer, Product Manager"
                    value={roadmapForm.career_goal} onChange={e => setRoadmapForm(p => ({ ...p, career_goal: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Timeline: {roadmapForm.timeline_months} months</label>
                  <input type="range" min={1} max={24} value={roadmapForm.timeline_months}
                    onChange={e => setRoadmapForm(p => ({ ...p, timeline_months: Number(e.target.value) }))}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1 month</span><span>24 months</span></div>
                </div>
              </div>
            )}

            {activeTool === 'startup' && (
              <div className="space-y-4">
                <h2 className="font-bold text-slate-800 text-lg">🚀 Startup Success Predictor</h2>
                <input className="input" placeholder="Startup name" value={startupForm.name}
                  onChange={e => setStartupForm(f => ({ ...f, name: e.target.value }))} />
                <select className="input" value={startupForm.stage}
                  onChange={e => setStartupForm(f => ({ ...f, stage: e.target.value }))}>
                  {['idea', 'mvp', 'seed', 'series-a'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="input" placeholder="Domain" value={startupForm.domain}
                  onChange={e => setStartupForm(f => ({ ...f, domain: e.target.value }))} />
              </div>
            )}

            {(activeTool === 'score' || activeTool === 'skillverify') && (
              <div>
                <h2 className="font-bold text-slate-800 text-lg mb-3">
                  {activeTool === 'score' ? '⚡ Innovation Score' : '✅ Skill Verification'}
                </h2>
                <p className="text-sm text-slate-600">
                  {activeTool === 'score'
                    ? 'AI calculates your innovation score from projects, startups, hackathons, and collaborations.'
                    : 'Verifies skill authenticity using profile depth and GitHub linkage.'}
                </p>
              </div>
            )}

            {activeTool === 'verify' && (
              <div>
                <h2 className="font-bold text-slate-800 text-lg mb-3">🛡️ Profile Verifier</h2>
                <p className="text-sm text-slate-600 mb-4">AI will analyze your profile for authenticity and calculate your trust score based on your skills, projects, and social links.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[['GitHub', user?.github_url], ['LinkedIn', user?.linkedin_url], ['Bio', user?.bio], ['Skills', user?.skills?.length > 0]].map(([label, val]) => (
                    <div key={label} className={`flex items-center gap-2 p-3 rounded-xl ${val ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                      <span>{val ? '✅' : '❌'}</span> {label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleRun} disabled={loading}
              className="btn-primary mt-5 flex items-center gap-2 w-full justify-center">
              {loading ? <><Loader size={16} className="animate-spin" /> Generating with AI...</> : <><Sparkles size={16} /> Generate with AI</>}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="card p-6 animate-slide-up">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles size={16} className="text-indigo-500" /> AI Results</h3>

              {result.type === 'ideas' && Array.isArray(result.data) && result.data.map((idea, i) => (
                <div key={i} className="mb-6 pb-6 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
                  <h4 className="font-bold text-indigo-700 text-lg mb-2">{idea.title}</h4>
                  <p className="text-slate-600 text-sm mb-3">{idea.description}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Key Features</p>
                      <ul className="space-y-1">{(idea.features || []).map((f, j) => <li key={j} className="text-sm text-slate-700 flex items-start gap-1.5"><span className="text-indigo-500 mt-0.5">•</span>{f}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Roadmap</p>
                      <div className="space-y-1">{(idea.roadmap || []).map((r, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold flex-shrink-0">{j+1}</span>
                          <span className="text-slate-700">{typeof r === 'object' ? `${r.title} (${r.duration})` : r}</span>
                        </div>
                      ))}</div>
                    </div>
                  </div>
                  {idea.architecture && <div className="mt-3 p-3 bg-slate-50 rounded-lg"><p className="text-xs font-semibold text-slate-500 mb-1">Architecture</p><p className="text-sm text-slate-700">{idea.architecture}</p></div>}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="badge badge-primary">⏱ {idea.estimated_time}</span>
                    <button onClick={() => {
                      api.post('/projects/', { title: idea.title, description: idea.description, ai_generated: true, tech_stack: ideaForm.tech_stack, domain: ideaForm.domain, difficulty: ideaForm.difficulty })
                        .then(() => toast.success('Project created from idea!'))
                        .catch(() => toast.error('Failed to create project'))
                    }} className="btn-primary text-xs px-3 py-1.5">Use This Idea →</button>
                  </div>
                </div>
              ))}

              {result.type === 'skills' && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-emerald-700 mb-2">💪 Strengths</p>
                      <ul className="space-y-1">{(result.data.strengths || []).map((s, i) => <li key={i} className="text-sm text-emerald-800">• {s}</li>)}</ul>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-700 mb-2">📈 Skill Gaps</p>
                      <ul className="space-y-1">{(result.data.skill_gaps || []).map((s, i) => <li key={i} className="text-sm text-amber-800">• {s}</li>)}</ul>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-indigo-700 mb-2">🎯 Improvement Plan</p>
                    <ol className="space-y-1">{(result.data.improvement_plan || []).map((s, i) => <li key={i} className="text-sm text-indigo-800">{i+1}. {s}</li>)}</ol>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-violet-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-violet-700 mb-2">💼 Internship Recommendations</p>
                      {(result.data.internship_recommendations || []).map((r, i) => (
                        <div key={i} className="mb-2"><p className="text-sm font-medium text-violet-800">{typeof r === 'object' ? r.type : r}</p>{r.companies && <p className="text-xs text-violet-600">{r.companies.join(', ')}</p>}</div>
                      ))}
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-rose-700 mb-2">🏆 Hackathon Recommendations</p>
                      <ul className="space-y-1">{(result.data.hackathon_recommendations || []).map((h, i) => <li key={i} className="text-sm text-rose-800">• {h}</li>)}</ul>
                    </div>
                  </div>
                </div>
              )}

              {result.type === 'resume' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Professional Summary</p>
                    <p className="text-sm text-slate-700">{result.data.summary}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-indigo-500 uppercase mb-2">Career Objective</p>
                    <p className="text-sm text-indigo-800">{result.data.objective}</p>
                  </div>
                  {result.data.project_descriptions?.map((pd, i) => (
                    <div key={i} className="bg-violet-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-violet-500 uppercase mb-2">Project {i+1}</p>
                      <p className="text-sm text-violet-800">{pd}</p>
                    </div>
                  ))}
                  <button onClick={() => { const text = `${result.data.summary}\n\n${result.data.objective}`; navigator.clipboard.writeText(text); toast.success('Copied to clipboard!') }}
                    className="btn-secondary text-sm">📋 Copy to Clipboard</button>
                </div>
              )}

              {result.type === 'roadmap' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {(result.data.phases || []).map((phase, i) => (
                      <div key={i} className="border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold flex items-center justify-center">{i+1}</div>
                          <div>
                            <p className="font-semibold text-slate-800">{phase.title}</p>
                            <p className="text-xs text-slate-400">{phase.duration_weeks} weeks</p>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs font-semibold text-slate-500 mb-1">Skills to Learn</p><ul>{(phase.skills_to_learn || []).map((s, j) => <li key={j} className="text-slate-700">• {s}</li>)}</ul></div>
                          <div><p className="text-xs font-semibold text-slate-500 mb-1">Resources</p><ul>{(phase.resources || []).map((r, j) => <li key={j} className="text-slate-700">• {r}</li>)}</ul></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {result.data.certifications?.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-700 mb-2">🏅 Recommended Certifications</p>
                      <div className="flex flex-wrap gap-2">{result.data.certifications.map((c, i) => <span key={i} className="badge badge-warning">{c}</span>)}</div>
                    </div>
                  )}
                </div>
              )}

              {result.type === 'startup' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50 text-center">
                    <p className="text-3xl font-black text-indigo-700">{result.data.success_probability}%</p>
                    <p className="text-xs text-indigo-600 font-semibold">Success Probability</p>
                  </div>
                  <div className="p-4 rounded-xl bg-violet-50 text-center">
                    <p className="text-3xl font-black text-violet-700">{result.data.innovation_score}</p>
                    <p className="text-xs text-violet-600 font-semibold">Innovation Score</p>
                  </div>
                  <p className="sm:col-span-2 text-sm">Market: <strong>{result.data.market_potential}</strong> · Risk: <strong>{result.data.risk_level}</strong></p>
                  <ul className="sm:col-span-2 text-sm space-y-1">{(result.data.insights || []).map((x, i) => <li key={i}>• {x}</li>)}</ul>
                </div>
              )}

              {result.type === 'score' && (
                <div className="text-center py-6">
                  <p className="text-5xl font-black gradient-text">{result.data.innovation_score}</p>
                  <p className="text-slate-500 mt-2">Rank: {result.data.rank}</p>
                </div>
              )}

              {result.type === 'skillverify' && (
                <div className="space-y-3">
                  <p className="text-2xl font-black text-emerald-600">{result.data.authenticity_score}% authentic</p>
                  <ul className="text-sm">{(result.data.verified_items || []).map((v, i) => <li key={i}>✅ {v}</li>)}</ul>
                </div>
              )}

              {result.type === 'verify' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${result.data.trust_score >= 70 ? 'bg-emerald-100 text-emerald-700' : result.data.trust_score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {result.data.trust_score?.toFixed(0)}%
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">Trust Score</p>
                      <span className={`badge ${result.data.risk_level === 'low' ? 'badge-success' : result.data.risk_level === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                        {result.data.risk_level?.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                  {result.data.recommendations?.length > 0 && (
                    <div className="bg-indigo-50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-indigo-700 mb-2">💡 Recommendations to improve</p>
                      <ul className="space-y-1">{result.data.recommendations.map((r, i) => <li key={i} className="text-sm text-indigo-800">• {r}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
