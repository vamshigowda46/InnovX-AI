import { getInitials, getRankColor, getSkillColor, timeAgo } from '../../utils/helpers'
import { Link } from 'react-router-dom'
import { MapPin, Github, Linkedin, Star, Users, Zap } from 'lucide-react'

export function UserCard({ user, matchScore, onConnect, showConnect = true }) {
  return (
    <div className="card-hover p-5 animate-slide-up">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user.avatar ? <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" /> : getInitials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${user.id}`} className="font-semibold text-slate-800 hover:text-indigo-600 truncate">{user.name}</Link>
            {user.is_verified && <span className="text-indigo-500" title="Verified">✓</span>}
          </div>
          <p className="text-xs text-slate-500 truncate">{user.department} {user.university ? `• ${user.university}` : ''}</p>
          {matchScore !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <Zap size={12} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">{matchScore}% match</span>
            </div>
          )}
        </div>
        <span className={`badge text-xs ${getRankColor(user.rank)}`}>{user.rank}</span>
      </div>

      {user.bio && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{user.bio}</p>}

      {user.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {user.skills.slice(0, 4).map(skill => (
            <span key={skill} className={`badge text-xs ${getSkillColor(skill)}`}>{skill}</span>
          ))}
          {user.skills.length > 4 && <span className="badge text-xs bg-slate-100 text-slate-500">+{user.skills.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {user.location && <span className="flex items-center gap-1"><MapPin size={11} />{user.location}</span>}
          <span className="flex items-center gap-1"><Star size={11} />{user.points || 0} pts</span>
        </div>
        <div className="flex items-center gap-2">
          {user.github_url && <a href={user.github_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700"><Github size={14} /></a>}
          {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600"><Linkedin size={14} /></a>}
          {showConnect && onConnect && (
            <button onClick={() => onConnect(user)} className="btn-primary text-xs px-3 py-1.5">Connect</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectCard({ project, onClick }) {
  const statusColors = { active: 'badge-success', completed: 'badge-primary', paused: 'badge-warning' }
  return (
    <div className="card-hover p-5 cursor-pointer animate-slide-up" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate hover:text-indigo-600">{project.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{project.domain}</p>
        </div>
        <span className={`badge ml-2 ${statusColors[project.status] || 'badge-primary'}`}>{project.status}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{project.description}</p>
      {project.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tech_stack.slice(0, 4).map(t => (
            <span key={t} className={`badge text-xs ${getSkillColor(t)}`}>{t}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Users size={11} />{project.team_size}</span>
          {project.ai_generated && <span className="badge-purple badge text-xs">AI Generated</span>}
        </div>
        <div className="flex items-center gap-2">
          {project.looking_for_members && <span className="badge-success badge text-xs">Hiring</span>}
          <span>{timeAgo(project.created_at)}</span>
        </div>
      </div>
      {project.progress > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progress</span><span>{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}

export function StartupCard({ startup, onClick }) {
  const stageColors = { idea: 'badge-primary', mvp: 'badge-warning', seed: 'badge-success', 'series-a': 'badge-purple' }
  return (
    <div className="card-hover p-5 cursor-pointer animate-slide-up" onClick={onClick}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {startup.logo ? <img src={startup.logo} className="w-11 h-11 rounded-xl object-cover" alt="" /> : startup.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{startup.name}</h3>
          <p className="text-xs text-slate-500 truncate">{startup.tagline}</p>
        </div>
        <span className={`badge ${stageColors[startup.stage] || 'badge-primary'}`}>{startup.stage}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{startup.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="badge-primary badge">{startup.domain}</span>
        <div className="flex items-center gap-2">
          {startup.is_hiring && <span className="badge-success badge">Hiring</span>}
          <span>{timeAgo(startup.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export function EventCard({ event, onRegister }) {
  const typeColors = { hackathon: 'badge-purple', workshop: 'badge-primary', meetup: 'badge-success', competition: 'badge-warning' }
  return (
    <div className="card-hover p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-slate-800 flex-1 pr-2">{event.title}</h3>
        <span className={`badge ${typeColors[event.event_type] || 'badge-primary'}`}>{event.event_type}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{event.description}</p>
      <div className="space-y-1.5 text-xs text-slate-500 mb-3">
        {event.start_date && <div className="flex items-center gap-1.5">📅 {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
        {event.location && <div className="flex items-center gap-1.5"><MapPin size={11} />{event.location}</div>}
        {event.prize_pool && <div className="flex items-center gap-1.5">🏆 {event.prize_pool}</div>}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{event.current_participants || 0} registered</span>
        {onRegister && (
          <button onClick={() => onRegister(event)} className="btn-primary text-xs px-3 py-1.5">Register</button>
        )}
      </div>
    </div>
  )
}

export function StatCard({ icon, label, value, color = 'indigo', trend }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="stat-card">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {trend && <p className="text-xs text-emerald-600 font-medium mt-0.5">{trend}</p>}
      </div>
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} style={{ borderWidth: 3 }} />
    </div>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function SkillBadge({ skill }) {
  return <span className={`badge ${getSkillColor(skill)}`}>{skill}</span>
}

export function ProgressBar({ value, color = 'indigo' }) {
  const colors = { indigo: 'from-indigo-500 to-violet-500', emerald: 'from-emerald-400 to-teal-500', amber: 'from-amber-400 to-orange-500' }
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  )
}
