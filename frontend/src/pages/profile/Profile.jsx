import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { LoadingSpinner, SkillBadge, ProgressBar } from '../../components/ui/Cards'
import { getInitials, getRankColor, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Github, Linkedin, Globe, MapPin, Edit3, Save, X, Plus, FileText, Award, User } from 'lucide-react'
import CertificateManager from '../../components/certificates/CertificateManager'
import PageTransition from '../../components/premium/PageTransition'

const DEPARTMENTS = ['Computer Science', 'Data Science', 'Electrical Engineering', 'Mechanical Engineering', 'Business', 'Design', 'Mathematics', 'Physics', 'Other']

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'resume', label: 'Resume', icon: FileText },
]

export default function Profile() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'overview'
  const { user: currentUser, updateUser, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [newSkill, setNewSkill] = useState('')
  const [newInterest, setNewInterest] = useState('')
  const fetchedRef = useRef(null)

  // Determine if viewing own profile
  const viewingOwnProfile = !id || (currentUser && Number(id) === currentUser.id)

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    if (viewingOwnProfile) {
      // Use currentUser directly — no API call needed
      if (currentUser) {
        setProfile(currentUser)
        setForm(currentUser)
      }
      return
    }

    // Viewing someone else's profile — fetch from API
    const targetId = Number(id)
    if (!targetId || fetchedRef.current === targetId) return
    fetchedRef.current = targetId

    setFetching(true)
    api.get(`/users/${targetId}`)
      .then(({ data }) => {
        setProfile(data.user)
        setForm(data.user)
      })
      .catch(() => toast.error('Could not load this profile'))
      .finally(() => setFetching(false))
  }, [id, authLoading, currentUser, viewingOwnProfile])

  // Keep own profile in sync when currentUser updates
  useEffect(() => {
    if (viewingOwnProfile && currentUser && !editing) {
      setProfile(currentUser)
    }
  }, [currentUser, viewingOwnProfile, editing])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/users/profile', form)
      setProfile(data.user)
      setForm(data.user)
      updateUser(data.user)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (!newSkill.trim()) return
    setForm(p => ({ ...p, skills: [...(p.skills || []), newSkill.trim()] }))
    setNewSkill('')
  }

  const removeSkill = (skill) => setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))

  const addInterest = () => {
    if (!newInterest.trim()) return
    setForm(p => ({ ...p, interests: [...(p.interests || []), newInterest.trim()] }))
    setNewInterest('')
  }

  const removeInterest = (i) => setForm(p => ({ ...p, interests: p.interests.filter(x => x !== i) }))

  const sendRequest = async () => {
    try {
      await api.post('/users/send-collab-request', { receiver_id: profile.id, message: 'Hi! I would love to collaborate with you.' })
      toast.success('Collaboration request sent!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request')
    }
  }

  if (authLoading) return <LoadingSpinner size="lg" />
  if (fetching) return <LoadingSpinner size="lg" />
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Profile not available</h3>
        <p className="text-sm text-slate-400">Complete your profile setup to see it here.</p>
      </div>
    )
  }

  const displayData = editing ? form : profile

  return (
    <PageTransition className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="card p-6 glass-card">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {profile.avatar
              ? <img src={profile.avatar} className="w-20 h-20 rounded-2xl object-cover" alt="" />
              : getInitials(profile.name)}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <input className="input text-xl font-bold mb-2" value={form.name || ''}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            ) : (
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-800">{profile.name}</h1>
                {profile.is_verified && <span className="text-indigo-500 text-lg" title="Verified">✓</span>}
              </div>
            )}

            {editing ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="input text-sm" value={form.department || ''}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                  <option value="">Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input className="input text-sm" placeholder="University" value={form.university || ''}
                  onChange={e => setForm(p => ({ ...p, university: e.target.value }))} />
              </div>
            ) : (
              <p className="text-slate-500 mb-2">
                {profile.department || 'No department set'}
                {profile.university ? ` • ${profile.university}` : ''}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge ${getRankColor(profile.rank)}`}>{profile.rank || 'Newcomer'}</span>
              <span className="badge badge-primary">⭐ {profile.points || 0} pts</span>
              <span className="badge badge-success">🛡️ {(profile.trust_score || 0).toFixed(0)}% trust</span>
              <span className="badge badge-purple">⚡ {profile.innovation_score || 0} score</span>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {viewingOwnProfile ? (
              editing ? (
                <>
                  <button onClick={saveProfile} disabled={saving}
                    className="btn-primary flex items-center gap-1.5 text-sm">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setForm(profile) }}
                    className="btn-secondary text-sm p-2.5"><X size={14} /></button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center gap-1.5 text-sm">
                  <Edit3 size={14} /> Edit Profile
                </button>
              )
            ) : (
              <button onClick={sendRequest} className="btn-primary text-sm">Connect</button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editing ? (
            <textarea className="input resize-none w-full" rows={3}
              placeholder="Tell the world about yourself..."
              value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
          ) : (
            <p className="text-slate-600">{profile.bio || <span className="text-slate-400 italic">No bio yet</span>}</p>
          )}
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 mt-4">
          {editing ? (
            <>
              <input className="input text-sm flex-1 min-w-48" placeholder="GitHub URL"
                value={form.github_url || ''} onChange={e => setForm(p => ({ ...p, github_url: e.target.value }))} />
              <input className="input text-sm flex-1 min-w-48" placeholder="LinkedIn URL"
                value={form.linkedin_url || ''} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))} />
              <input className="input text-sm flex-1 min-w-48" placeholder="Portfolio URL"
                value={form.portfolio_url || ''} onChange={e => setForm(p => ({ ...p, portfolio_url: e.target.value }))} />
              <input className="input text-sm flex-1 min-w-48" placeholder="Location (City, Country)"
                value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </>
          ) : (
            <>
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
                  <Github size={15} /> GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600">
                  <Linkedin size={15} /> LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600">
                  <Globe size={15} /> Portfolio
                </a>
              )}
              {profile.location && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={15} />{profile.location}
                </span>
              )}
              {!profile.github_url && !profile.linkedin_url && !profile.location && !editing && (
                <span className="text-sm text-slate-400 italic">No links added yet</span>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            onClick={() => setSearchParams(tabId === 'overview' ? {} : { tab: tabId })}
            className={`feed-tab flex items-center gap-2 ${activeTab === tabId ? 'active' : ''}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'certificates' && (
        <CertificateManager userId={viewingOwnProfile ? undefined : profile.id} editable={viewingOwnProfile} />
      )}

      {activeTab === 'resume' && viewingOwnProfile && (
        <div className="card p-8 text-center">
          <FileText className="mx-auto text-violet-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800">Professional Resume Builder</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Live preview, multiple templates, PDF export, and AI-enhanced content.</p>
          <Link to="/resume" className="btn-primary inline-flex items-center gap-2 mt-6">Open Resume Studio</Link>
        </div>
      )}

      {activeTab === 'overview' && (
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Skills */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(displayData.skills || []).map(skill => (
                <div key={skill} className="flex items-center gap-1">
                  <SkillBadge skill={skill} />
                  {editing && (
                    <button onClick={() => removeSkill(skill)}
                      className="text-red-400 hover:text-red-600 text-xs leading-none">×</button>
                  )}
                </div>
              ))}
              {(displayData.skills || []).length === 0 && (
                <p className="text-sm text-slate-400">{editing ? 'Add your first skill below' : 'No skills added yet'}</p>
              )}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input className="input text-sm flex-1" placeholder="e.g. React, Python, Machine Learning..."
                  value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
                <button onClick={addSkill} className="btn-primary text-sm px-3"><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(displayData.interests || []).map(interest => (
                <div key={interest} className="flex items-center gap-1">
                  <span className="badge badge-purple">{interest}</span>
                  {editing && (
                    <button onClick={() => removeInterest(interest)}
                      className="text-red-400 hover:text-red-600 text-xs leading-none">×</button>
                  )}
                </div>
              ))}
              {(displayData.interests || []).length === 0 && (
                <p className="text-sm text-slate-400">{editing ? 'Add your first interest below' : 'No interests added yet'}</p>
              )}
            </div>
            {editing && (
              <div className="flex gap-2">
                <input className="input text-sm flex-1" placeholder="e.g. AI, Startups, Web Dev..."
                  value={newInterest} onChange={e => setNewInterest(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }} />
                <button onClick={addInterest} className="btn-primary text-sm px-3"><Plus size={14} /></button>
              </div>
            )}
          </div>

          {/* Achievements */}
          {(profile.achievements || []).length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-3">🏆 Achievements</h3>
              <div className="grid grid-cols-2 gap-3">
                {profile.achievements.map(a => (
                  <div key={a.id} className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-3">
                    <span className="text-2xl">{a.badge_icon || '🏅'}</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">{a.title}</p>
                      <p className="text-xs text-amber-600">+{a.points_awarded} pts • {timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-slate-800">Stats</h3>
            {[
              ['Innovation Score', profile.innovation_score || 0, 1000, 'indigo'],
              ['Trust Score', profile.trust_score || 0, 100, 'emerald'],
              ['Points', Math.min(profile.points || 0, 10000), 10000, 'amber'],
            ].map(([label, val, max, color]) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-semibold text-slate-800">{Number(val).toFixed(0)}</span>
                </div>
                <ProgressBar value={(val / max) * 100} color={color} />
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="card p-5 space-y-2 text-sm">
            <h3 className="font-bold text-slate-800 mb-3">Info</h3>
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-slate-500">Year of Study</label>
                  <input type="number" className="input text-sm mt-1" min={1} max={6}
                    value={form.year_of_study || ''}
                    onChange={e => setForm(p => ({ ...p, year_of_study: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Hackathons Participated</label>
                  <input type="number" className="input text-sm mt-1" min={0}
                    value={form.hackathon_count || 0}
                    onChange={e => setForm(p => ({ ...p, hackathon_count: Number(e.target.value) }))} />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="startup" checked={form.startup_interest || false}
                    onChange={e => setForm(p => ({ ...p, startup_interest: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600" />
                  <label htmlFor="startup" className="text-sm text-slate-700">Interested in startups</label>
                </div>
              </>
            ) : (
              <>
                {profile.year_of_study && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Year</span>
                    <span className="font-medium">Year {profile.year_of_study}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Hackathons</span>
                  <span className="font-medium">{profile.hackathon_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Startup Interest</span>
                  <span className="font-medium">{profile.startup_interest ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-medium">{timeAgo(profile.created_at)}</span>
                </div>
                {profile.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium truncate max-w-32">{profile.email}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      )}
    </PageTransition>
  )
}
