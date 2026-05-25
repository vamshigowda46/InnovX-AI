import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { UserCard, LoadingSpinner, EmptyState } from '../../components/ui/Cards'
import toast from 'react-hot-toast'
import { Users, Zap, Search, Filter } from 'lucide-react'

export default function TeamMatch() {
  const [matches, setMatches] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('ai')
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  useEffect(() => {
    if (tab === 'ai') fetchMatches()
    else fetchUsers()
  }, [tab])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users/match-recommendations')
      setMatches(data.matches)
    } catch { toast.error('Failed to load matches') }
    finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, skill: skillFilter, department: deptFilter, per_page: 24 })
      const { data } = await api.get(`/users/?${params}`)
      setAllUsers(data.users)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'search') {
      const t = setTimeout(fetchUsers, 400)
      return () => clearTimeout(t)
    }
  }, [search, skillFilter, deptFilter, tab])

  const sendRequest = async (targetUser) => {
    try {
      await api.post('/users/send-collab-request', { receiver_id: targetUser.id, message: 'Hi! I would love to collaborate with you.' })
      toast.success(`Request sent to ${targetUser.name}!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Users size={24} className="text-indigo-600" /> Team Matching</h1>
        <p className="text-slate-500 text-sm mt-0.5">Find your perfect collaborators using AI-powered matching</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('ai')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'ai' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-1.5"><Zap size={14} /> AI Matches</span>
        </button>
        <button onClick={() => setTab('search')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'search' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <span className="flex items-center gap-1.5"><Search size={14} /> Search</span>
        </button>
      </div>

      {tab === 'search' && (
        <div className="card p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9 py-2 text-sm" placeholder="Search by name..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="input py-2 text-sm w-48" placeholder="Filter by skill..."
            value={skillFilter} onChange={e => setSkillFilter(e.target.value)} />
          <input className="input py-2 text-sm w-48" placeholder="Filter by department..."
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)} />
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          {tab === 'ai' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm text-slate-600 font-medium">{matches.length} AI-powered matches found</p>
              </div>
              {matches.length === 0 ? (
                <EmptyState icon="🤖" title="No matches yet" description="Complete your profile with skills and interests to get AI matches" />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {matches.map(u => <UserCard key={u.id} user={u} matchScore={u.match_score} onConnect={sendRequest} />)}
                </div>
              )}
            </>
          )}
          {tab === 'search' && (
            allUsers.length === 0 ? (
              <EmptyState icon="👥" title="No users found" description="Try different search terms" />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allUsers.map(u => <UserCard key={u.id} user={u} onConnect={sendRequest} />)}
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
