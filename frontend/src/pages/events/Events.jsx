import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import { EventCard, LoadingSpinner, EmptyState, Modal } from '../../components/ui/Cards'
import toast from 'react-hot-toast'
import { Plus, Search, Map, List } from 'lucide-react'

const EVENT_TYPES = ['hackathon', 'workshop', 'meetup', 'competition', 'conference']

function EventsMap({ events }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([20, 0], 2)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = { map, L }

      // Add event markers
      const withCoords = events.filter(e => e.latitude && e.longitude)
      withCoords.forEach(event => {
        const typeColors = { hackathon: '#8b5cf6', workshop: '#6366f1', meetup: '#10b981', competition: '#f59e0b', conference: '#3b82f6' }
        const color = typeColors[event.event_type] || '#6366f1'

        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })

        L.marker([event.latitude, event.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px">
              <strong style="color:#1e293b">${event.title}</strong><br/>
              <span style="color:${color};font-size:11px;font-weight:600;text-transform:capitalize">${event.event_type}</span><br/>
              ${event.start_date ? `<span style="color:#64748b;font-size:11px">📅 ${new Date(event.start_date).toLocaleDateString()}</span><br/>` : ''}
              ${event.prize_pool ? `<span style="color:#10b981;font-size:11px">🏆 ${event.prize_pool}</span>` : ''}
            </div>
          `)
      })

      if (withCoords.length > 0) {
        map.fitBounds(withCoords.map(e => [e.latitude, e.longitude]), { padding: [40, 40] })
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [events])

  return (
    <div className="card overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Map size={15} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Events Map</span>
        <span className="text-xs text-slate-400 ml-1">— OpenStreetMap (free)</span>
      </div>
      <div ref={mapRef} style={{ height: '280px', zIndex: 0 }} />
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('grid') // 'grid' | 'map'
  const [filters, setFilters] = useState({ search: '', type: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'hackathon',
    start_date: '', end_date: '', location: '',
    is_online: false, registration_url: '', prize_pool: '',
    max_participants: '', tags: ''
  })

  useEffect(() => { fetchEvents() }, [filters])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ ...filters, per_page: 20 })
      const { data } = await api.get(`/events/?${params}`)
      setEvents(data.events || [])
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        max_participants: form.max_participants ? Number(form.max_participants) : null
      }
      await api.post('/events/', payload)
      toast.success('Event created!')
      setShowCreate(false)
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create event')
    } finally { setCreating(false) }
  }

  const registerForEvent = async (event) => {
    try {
      await api.post(`/events/${event.id}/register`)
      toast.success(`Registered for ${event.title}!`)
      fetchEvents()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Events & Hackathons</h1>
          <p className="text-slate-500 text-sm mt-0.5">Discover hackathons, workshops, and innovation events</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Filters + view toggle */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search events..."
            value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        </div>
        <select className="input py-2 text-sm w-auto" value={filters.type}
          onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">All Types</option>
          {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
            <List size={14} /> List
          </button>
          <button onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'map' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
            <Map size={14} /> Map
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : events.length === 0 ? (
        <EmptyState icon="📅" title="No events found" description="Create the first event!"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary">Create Event</button>} />
      ) : (
        <>
          {view === 'map' && <EventsMap events={events} />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(e => <EventCard key={e.id} event={e} onRegister={registerForEvent} />)}
          </div>
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Event" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Event Title *</label>
            <input className="input" placeholder="HackInnovate 2024" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
              <select className="input" value={form.event_type}
                onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Prize Pool</label>
              <input className="input" placeholder="$10,000" value={form.prize_pool}
                onChange={e => setForm(p => ({ ...p, prize_pool: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input type="datetime-local" className="input" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date</label>
              <input type="datetime-local" className="input" value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="online" checked={form.is_online}
              onChange={e => setForm(p => ({ ...p, is_online: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="online" className="text-sm text-slate-700">Online Event</label>
          </div>
          {!form.is_online && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input className="input" placeholder="MIT Campus, Cambridge, MA" value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tags (comma separated)</label>
            <input className="input" placeholder="AI, Web Dev, Mobile..." value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
