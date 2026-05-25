import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { LoadingSpinner, EmptyState, Modal } from '../../components/ui/Cards'
import { getInitials } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Star, Calendar, Clock, Plus } from 'lucide-react'

export default function Mentors() {
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [showBook, setShowBook] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [bookForm, setBookForm] = useState({ scheduled_at: '', duration_minutes: 60, topic: '' })
  const [regForm, setRegForm] = useState({ expertise: '', experience_years: '', company: '', designation: '', hourly_rate: '', bio: '' })
  const [booking, setBooking] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => { fetchMentors() }, [])

  const fetchMentors = async () => {
    try {
      const { data } = await api.get('/mentors/')
      setMentors(data.mentors)
    } catch {} finally { setLoading(false) }
  }

  const bookSession = async (e) => {
    e.preventDefault()
    setBooking(true)
    try {
      await api.post('/mentors/book-session', { mentor_id: selectedMentor.id, ...bookForm })
      toast.success('Session booked! 🎉')
      setShowBook(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed')
    } finally { setBooking(false) }
  }

  const registerAsMentor = async (e) => {
    e.preventDefault()
    setRegistering(true)
    try {
      const payload = {
        ...regForm,
        expertise: regForm.expertise.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: Number(regForm.experience_years),
        hourly_rate: Number(regForm.hourly_rate)
      }
      await api.post('/mentors/register', payload)
      toast.success('Registered as mentor! 🎓')
      setShowRegister(false)
      fetchMentors()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally { setRegistering(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Mentor Connect</h1>
          <p className="text-slate-500 text-sm mt-0.5">Learn from industry experts and experienced professionals</p>
        </div>
        <button onClick={() => setShowRegister(true)} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Become a Mentor
        </button>
      </div>

      {mentors.length === 0 ? (
        <EmptyState icon="🎓" title="No mentors yet" description="Be the first to register as a mentor!"
          action={<button onClick={() => setShowRegister(true)} className="btn-primary">Register as Mentor</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mentors.map(mentor => (
            <div key={mentor.id} className="card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {mentor.user?.avatar ? <img src={mentor.user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" /> : getInitials(mentor.user?.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800">{mentor.user?.name}</h3>
                  <p className="text-xs text-slate-500">{mentor.designation} {mentor.company ? `@ ${mentor.company}` : ''}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-semibold text-amber-600">{mentor.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-slate-400">({mentor.total_sessions} sessions)</span>
                  </div>
                </div>
                {mentor.hourly_rate > 0 ? (
                  <span className="text-sm font-bold text-indigo-600">${mentor.hourly_rate}/hr</span>
                ) : (
                  <span className="badge-success badge text-xs">Free</span>
                )}
              </div>

              {mentor.bio && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{mentor.bio}</p>}

              <div className="flex flex-wrap gap-1 mb-4">
                {(mentor.expertise || []).slice(0, 4).map(e => (
                  <span key={e} className="badge badge-primary text-xs">{e}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1"><Clock size={11} />{mentor.experience_years}y exp</span>
                <span className={`badge text-xs ${mentor.is_available ? 'badge-success' : 'badge-warning'}`}>
                  {mentor.is_available ? 'Available' : 'Busy'}
                </span>
              </div>

              <button onClick={() => { setSelectedMentor(mentor); setShowBook(true) }}
                disabled={!mentor.is_available}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                <Calendar size={14} /> Book Session
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Book Session Modal */}
      <Modal isOpen={showBook} onClose={() => setShowBook(false)} title={`Book Session with ${selectedMentor?.user?.name}`}>
        <form onSubmit={bookSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
            <input className="input" placeholder="What do you want to discuss?" value={bookForm.topic}
              onChange={e => setBookForm(p => ({ ...p, topic: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Date & Time</label>
            <input type="datetime-local" className="input" value={bookForm.scheduled_at}
              onChange={e => setBookForm(p => ({ ...p, scheduled_at: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
            <select className="input" value={bookForm.duration_minutes} onChange={e => setBookForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowBook(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={booking} className="btn-primary flex-1">
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Register as Mentor Modal */}
      <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Register as Mentor" size="lg">
        <form onSubmit={registerAsMentor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Areas of Expertise (comma separated)</label>
            <input className="input" placeholder="React, Machine Learning, Entrepreneurship..." value={regForm.expertise}
              onChange={e => setRegForm(p => ({ ...p, expertise: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
              <input type="number" className="input" placeholder="5" value={regForm.experience_years}
                onChange={e => setRegForm(p => ({ ...p, experience_years: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hourly Rate ($, 0 for free)</label>
              <input type="number" className="input" placeholder="0" value={regForm.hourly_rate}
                onChange={e => setRegForm(p => ({ ...p, hourly_rate: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
              <input className="input" placeholder="Google, Startup..." value={regForm.company}
                onChange={e => setRegForm(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
              <input className="input" placeholder="Senior Engineer, CTO..." value={regForm.designation}
                onChange={e => setRegForm(p => ({ ...p, designation: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
            <textarea className="input resize-none" rows={3} placeholder="Tell students about yourself..."
              value={regForm.bio} onChange={e => setRegForm(p => ({ ...p, bio: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={registering} className="btn-primary flex-1">
              {registering ? 'Registering...' : '🎓 Register as Mentor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
