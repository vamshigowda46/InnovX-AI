export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
}

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const getRankColor = (rank) => {
  const colors = {
    Legend: 'text-yellow-600 bg-yellow-50',
    Expert: 'text-purple-600 bg-purple-50',
    Advanced: 'text-blue-600 bg-blue-50',
    Intermediate: 'text-green-600 bg-green-50',
    'Rising Star': 'text-orange-600 bg-orange-50',
    Explorer: 'text-indigo-600 bg-indigo-50',
    Newcomer: 'text-slate-600 bg-slate-50',
  }
  return colors[rank] || 'text-slate-600 bg-slate-50'
}

export const getStageColor = (stage) => {
  const colors = {
    idea: 'bg-blue-100 text-blue-700',
    mvp: 'bg-amber-100 text-amber-700',
    seed: 'bg-green-100 text-green-700',
    'series-a': 'bg-purple-100 text-purple-700',
  }
  return colors[stage] || 'bg-slate-100 text-slate-700'
}

export const truncate = (str, n = 100) =>
  str && str.length > n ? str.slice(0, n) + '...' : str

export const skillColors = [
  'bg-indigo-100 text-indigo-700', 'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700', 'bg-pink-100 text-pink-700',
]

export const getSkillColor = (skill) =>
  skillColors[skill.charCodeAt(0) % skillColors.length]
