import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/helpers'
import TiltCard from '../../components/premium/TiltCard'
import PageTransition from '../../components/premium/PageTransition'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { useNavigate } from 'react-router-dom'
import {
  Users, Check, X, Clock, Send, UserPlus, BarChart3,
  Activity, Wifi, Sparkles, Crown, Mail, Loader2, UserMinus
} from 'lucide-react'

export default function CollaborationHub() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [requests, setRequests] = useState({ received: [], sent: [], accepted: [] })
  const [activeCollabs, setActiveCollabs] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('requests')
  const [actionLoading, setActionLoading] = useState(null)
  const [teamForm, setTeamForm] = useState({ name: '', description: '', max_members: 5 })
  const [showTeamForm, setShowTeamForm] = useState(false)

  const load = useCallback(async () => {
    try {
      const [d, r, a, s, o] = await Promise.all([
        api.get('/collaboration/dashboard'),
        api.get('/collaboration/requests'),
        api.get('/collaboration/active'),
        api.get('/collaboration/suggestions'),
        api.get('/collaboration/online-users'),
      ])
      setDashboard(d.data)
      setRequests({
        received: r.data.received || [],
        sent: r.data.sent || [],
        accepted: r.data.accepted || [],
      })
      setActiveCollabs(a.data.collaborations || [])
      setSuggestions(s.data.suggestions || [])
      setOnlineUsers(o.data.online_users || [])
    } catch (err) {
      toast.error(err.userMessage || 'Failed to load collaboration hub')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const withAction = async (key, fn, successMsg) => {
    setActionLoading(key)
    try {
      await fn()
      toast.success(successMsg)
      await load()
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.error || err.response?.data?.detail || 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const acceptRequest = (id) => withAction(`req-accept-${id}`, async () => {
    try {
      await api.put(`/collaboration/requests/${id}/accept`)
    } catch (e) {
      if (e.response?.status === 404 || e.response?.status >= 500) {
        await api.put(`/users/collab-requests/${id}`, { status: 'accepted' })
      } else throw e
    }
  }, 'Collaboration accepted!')

  const rejectRequest = (id) => withAction(`req-reject-${id}`, async () => {
    try {
      await api.put(`/collaboration/requests/${id}/reject`)
    } catch (e) {
      await api.put(`/users/collab-requests/${id}`, { status: 'rejected' })
    }
  }, 'Request declined')
  const cancelRequest = (id) => withAction(`req-cancel-${id}`, () => api.delete(`/collaboration/requests/${id}/cancel`), 'Request cancelled')
  const acceptInvite = (id) => withAction(`inv-accept-${id}`, () => api.put(`/collaboration/invites/${id}/accept`), 'Joined team!')
  const rejectInvite = (id) => withAction(`inv-reject-${id}`, () => api.put(`/collaboration/invites/${id}/reject`), 'Invite declined')
  const removeCollab = (id) => withAction(`collab-rm-${id}`, () => api.delete(`/collaboration/active/${id}`), 'Collaboration removed')

  const createTeam = async () => {
    if (!teamForm.name.trim()) return toast.error('Team name required')
    setActionLoading('create-team')
    try {
      await api.post('/collaboration/teams', teamForm)
      toast.success('Team created!')
      setShowTeamForm(false)
      setTeamForm({ name: '', description: '', max_members: 5 })
      await load()
    } catch (err) {
      toast.error(err.userMessage || 'Failed to create team')
    } finally {
      setActionLoading(null)
    }
  }

  const sendCollab = async (receiverId) => {
    setActionLoading(`send-${receiverId}`)
    try {
      await api.post('/users/send-collab-request', {
        receiver_id: receiverId,
        message: "Let's innovate together on InnovX!",
      })
      toast.success('Request sent!')
      await load()
    } catch (err) {
      toast.error(err.userMessage || err.response?.data?.error || 'Could not send request')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingReceived = requests.received.filter(r => r.status === 'pending')
  const pendingSent = requests.sent.filter(r => r.status === 'pending')

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto premium-bg min-h-full">
        <SkeletonGrid count={4} />
      </div>
    )
  }

  return (
    <PageTransition className="relative min-h-full premium-bg">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-black gradient-text">Collaboration Hub</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Teams · Requests · Real-time · AI matching</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Pending In', value: dashboard?.stats?.pending_received, icon: Mail, color: 'text-amber-400' },
            { label: 'Pending Out', value: dashboard?.stats?.pending_sent, icon: Send, color: 'text-indigo-400' },
            { label: 'Active', value: dashboard?.stats?.active_collaborations, icon: Users, color: 'text-emerald-400' },
            { label: 'Teams', value: dashboard?.stats?.teams_led, icon: Crown, color: 'text-violet-400' },
            { label: 'Online', value: onlineUsers.length, icon: Wifi, color: 'text-cyan-400' },
          ].map((s, i) => (
            <TiltCard key={s.label} className="glass-card p-4" intensity={4}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <s.icon size={20} className={`${s.color} mb-2`} />
                <p className="text-xl sm:text-2xl font-black text-slate-800">{s.value ?? 0}</p>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              </motion.div>
            </TiltCard>
          ))}
        </div>

        <div className="flex gap-2 glass-premium p-1.5 rounded-2xl overflow-x-auto">
          {['requests', 'teams', 'suggestions', 'activity'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`feed-tab capitalize ${tab === t ? 'active' : ''}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {tab === 'requests' && (
              <section className="space-y-4">
                <div className="glass-card p-5">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Mail size={18} className="text-cyan-400" /> Team Invites
                  </h2>
                  {dashboard?.invites_received?.length === 0 && (
                    <p className="text-sm text-slate-500 py-2">No pending team invites</p>
                  )}
                  <AnimatePresence>
                    {dashboard?.invites_received?.map(inv => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="invite-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{inv.team?.name}</p>
                          <p className="text-xs text-slate-400">From {inv.inviter?.name} · {inv.role}</p>
                        </div>
                        <div className="flex gap-2">
                          <ActionButton
                            loading={actionLoading === `inv-accept-${inv.id}`}
                            onClick={() => acceptInvite(inv.id)}
                            variant="primary"
                            icon={Check}
                            label="Accept"
                          />
                          <ActionButton
                            loading={actionLoading === `inv-reject-${inv.id}`}
                            onClick={() => rejectInvite(inv.id)}
                            variant="danger"
                            icon={X}
                            label="Decline"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="glass-card p-5">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Clock size={18} className="text-amber-400" /> Collaboration Requests
                  </h2>
                  {pendingReceived.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">No pending incoming requests</p>
                  ) : (
                    pendingReceived.map(req => (
                      <motion.div
                        key={req.id}
                        layout
                        className="invite-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={req.sender?.name} />
                          <div>
                            <p className="font-semibold text-slate-800">{req.sender?.name || 'Innovator'}</p>
                            <p className="text-xs text-slate-400 max-w-xs">{req.message || 'Wants to collaborate'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ActionButton
                            loading={actionLoading === `req-accept-${req.id}`}
                            onClick={() => acceptRequest(req.id)}
                            variant="primary"
                            icon={Check}
                            label="Accept"
                          />
                          <ActionButton
                            loading={actionLoading === `req-reject-${req.id}`}
                            onClick={() => rejectRequest(req.id)}
                            variant="danger"
                            icon={X}
                            label="Decline"
                          />
                        </div>
                      </motion.div>
                    ))
                  )}

                  {pendingSent.length > 0 && (
                    <>
                      <h3 className="font-semibold text-slate-400 text-sm mt-6 mb-2">Sent (pending)</h3>
                      {pendingSent.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 mb-2">
                          <span className="text-sm text-slate-300">
                            To {req.receiver?.name || `User #${req.receiver_id}`}
                          </span>
                          <button
                            onClick={() => cancelRequest(req.id)}
                            disabled={actionLoading === `req-cancel-${req.id}`}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                          >
                            {actionLoading === `req-cancel-${req.id}` ? <Loader2 size={12} className="animate-spin" /> : null}
                            Cancel
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="glass-card p-5">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Users size={18} className="text-emerald-400" /> Active Collaborations
                  </h2>
                  {activeCollabs.length === 0 && requests.accepted.length === 0 ? (
                    <p className="text-sm text-slate-500">Accept requests to start collaborating</p>
                  ) : (
                    <>
                      {activeCollabs.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                          <div className="flex items-center gap-2">
                            <Check size={16} className="text-emerald-400" />
                            <span className="text-sm text-slate-700">{c.partner?.name || 'Partner'}</span>
                          </div>
                          <button
                            onClick={() => removeCollab(c.id)}
                            disabled={actionLoading === `collab-rm-${c.id}`}
                            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1"
                          >
                            <UserMinus size={12} /> Remove
                          </button>
                        </div>
                      ))}
                      {requests.accepted.filter(r =>
                        !activeCollabs.some(c =>
                          c.partner?.id === r.sender_id || c.partner?.id === r.receiver_id
                        )
                      ).map(req => (
                        <div key={req.id} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 mb-2 text-sm text-slate-300">
                          <Check size={14} className="text-emerald-400" />
                          {req.sender?.name || req.receiver?.name || 'Collaborator'} — accepted
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>
            )}

            {tab === 'teams' && (
              <section className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    <Users size={18} /> My Teams
                  </h2>
                  <button onClick={() => setShowTeamForm(!showTeamForm)} className="btn-3d text-sm py-2">
                    <UserPlus size={16} className="inline mr-1" /> Create Team
                  </button>
                </div>
                <AnimatePresence>
                  {showTeamForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 space-y-3 overflow-hidden"
                    >
                      <input className="input" placeholder="Team name" value={teamForm.name}
                        onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} />
                      <textarea className="input" placeholder="Description" rows={2}
                        value={teamForm.description}
                        onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))} />
                      <button onClick={createTeam} disabled={actionLoading === 'create-team'} className="btn-3d flex items-center gap-2">
                        {actionLoading === 'create-team' && <Loader2 size={16} className="animate-spin" />}
                        Create
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {dashboard?.teams?.length === 0 && (
                  <p className="text-sm text-slate-500">Create a team to invite innovators</p>
                )}
                {dashboard?.teams?.map(team => (
                  <div key={team.id} className="p-4 rounded-xl border border-white/5 mb-3 hover:border-violet-500/20 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800">{team.name}</h3>
                      {team.is_leader && <span className="badge badge-purple"><Crown size={10} /> Leader</span>}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{team.description || 'No description'}</p>
                    <p className="text-xs text-slate-500 mt-2">{team.member_count}/{team.max_members} members</p>
                  </div>
                ))}
              </section>
            )}

            {tab === 'suggestions' && (
              <section className="glass-card p-5">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-violet-400" /> AI Teammate Match
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {suggestions.map((u, i) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-xl gradient-border bg-surface-elevated/50"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={u.name} />
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-cyan-400 font-bold">{u.match_score}% match</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {u.skills?.slice(0, 4).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{s}</span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendCollab(u.id)}
                          disabled={actionLoading === `send-${u.id}`}
                          className="btn-3d flex-1 text-sm py-2 flex items-center justify-center gap-1"
                        >
                          {actionLoading === `send-${u.id}` && <Loader2 size={14} className="animate-spin" />}
                          Collaborate
                        </button>
                        <button onClick={() => navigate(`/profile/${u.id}`)} className="btn-glass text-sm py-2">Profile</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {tab === 'activity' && (
              <section className="glass-card p-5">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-pink-400" /> Live Activity
                </h2>
                {!dashboard?.recent_activity?.length ? (
                  <p className="text-sm text-slate-500">Activity appears as you collaborate</p>
                ) : (
                  dashboard.recent_activity.map(a => (
                    <div key={a.id} className="flex gap-3 py-3 border-b border-white/5 last:border-0">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-2 animate-pulse flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{a.title}</p>
                        <p className="text-xs text-slate-500">{a.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}
          </div>

          <aside className="space-y-5">
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Wifi size={16} className="text-emerald-400" /> Online
              </h3>
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-slate-500">No one online</p>
              ) : onlineUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2 py-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-300">{u.name}</span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                <BarChart3 size={16} className="text-violet-400" /> Analytics
              </h3>
              <div className="space-y-3 text-sm">
                <Row label="Memberships" value={dashboard?.stats?.team_memberships} />
                <Row label="Pending invites" value={dashboard?.stats?.pending_invites} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-glow">
      {getInitials(name)}
    </div>
  )
}

function ActionButton({ loading, onClick, variant, icon: Icon, label }) {
  const cls = variant === 'primary' ? 'btn-3d' : 'btn-danger-glass'
  return (
    <button onClick={onClick} disabled={loading} className={`${cls} py-2 px-3 text-sm flex items-center gap-1.5 min-w-[88px] justify-center`}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold text-slate-700">{value ?? 0}</span>
    </div>
  )
}
