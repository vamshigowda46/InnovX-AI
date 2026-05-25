import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { UserCard, LoadingSpinner, EmptyState } from '../../components/ui/Cards'
import { getRankColor, getInitials } from '../../utils/helpers'
import { Trophy, Medal } from 'lucide-react'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/users/leaderboard').then(({ data }) => setUsers(data.leaderboard)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Trophy size={24} className="text-amber-500" /> Leaderboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Top innovators in the InnovX AI ecosystem</p>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {[top3[1], top3[0], top3[2]].map((u, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3
            const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' }
            const colors = { 1: 'from-amber-400 to-yellow-500', 2: 'from-slate-300 to-slate-400', 3: 'from-orange-400 to-amber-500' }
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
            return (
              <div key={u.id} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg border-4 border-white shadow-lg">
                  {u.avatar ? <img src={u.avatar} className="w-14 h-14 rounded-full object-cover" alt="" /> : getInitials(u.name)}
                </div>
                <p className="text-sm font-bold text-slate-800 text-center">{u.name.split(' ')[0]}</p>
                <p className="text-xs text-slate-500">{u.points} pts</p>
                <div className={`w-24 ${heights[rank]} bg-gradient-to-t ${colors[rank]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-2xl">{medals[rank]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="card divide-y divide-slate-50">
        {rest.map((u, i) => (
          <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
            <span className="w-8 text-center text-sm font-bold text-slate-400">{i + 4}</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {u.avatar ? <img src={u.avatar} className="w-9 h-9 rounded-full object-cover" alt="" /> : getInitials(u.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{u.name}</p>
              <p className="text-xs text-slate-400 truncate">{u.department}</p>
            </div>
            <span className={`badge text-xs ${getRankColor(u.rank)}`}>{u.rank}</span>
            <div className="text-right">
              <p className="font-bold text-slate-800">{u.points}</p>
              <p className="text-xs text-slate-400">points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
