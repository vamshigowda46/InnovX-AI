import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { UserCard, LoadingSpinner } from '../../components/ui/Cards'
import { MapPin, Navigation, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NearbyCollaborators() {
  const { user } = useAuth()
  const [nearbyUsers, setNearbyUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [radius, setRadius] = useState(50)
  const [userLocation, setUserLocation] = useState(
    user?.latitude ? { lat: user.latitude, lng: user.longitude } : null
  )
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Init Leaflet map after component mounts
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icon paths broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [20.5937, 78.9629] // Default: center of India

      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, userLocation ? 10 : 4)

      // OpenStreetMap tiles — completely free, no key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = { map, L }

      // Add current user marker if location known
      if (userLocation) {
        addUserMarker(L, map, userLocation)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const addUserMarker = (L, map, loc) => {
    const youIcon = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(99,102,241,0.5)"></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    L.marker([loc.lat, loc.lng], { icon: youIcon })
      .addTo(map)
      .bindPopup('<strong>📍 You are here</strong>')
  }

  const updateMapMarkers = (L, map, users) => {
    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    users.forEach(u => {
      if (!u.latitude || !u.longitude) return

      const icon = L.divIcon({
        html: `<div style="width:12px;height:12px;background:#8b5cf6;border:2px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(139,92,246,0.4)"></div>`,
        className: '',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })

      const marker = L.marker([u.latitude, u.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:140px">
            <strong style="color:#1e293b">${u.name}</strong><br/>
            <span style="color:#64748b;font-size:12px">${u.department || ''}</span><br/>
            <span style="color:#6366f1;font-size:12px;font-weight:600">${u.distance_km} km away</span>
          </div>
        `)

      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    if (users.length > 0 && userLocation) {
      const allPoints = [
        [userLocation.lat, userLocation.lng],
        ...users.filter(u => u.latitude).map(u => [u.latitude, u.longitude])
      ]
      map.fitBounds(allPoints, { padding: [40, 40] })
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude }
        setUserLocation(loc)

        // Update map center
        if (mapInstanceRef.current) {
          const { map, L } = mapInstanceRef.current
          map.setView([loc.lat, loc.lng], 11)
          addUserMarker(L, map, loc)
        }

        try {
          await api.put('/users/profile', { latitude: loc.lat, longitude: loc.lng })
          toast.success('Location saved!')
        } catch {
          toast.error('Could not save location to profile')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) toast.error('Location permission denied. Please allow location access.')
        else toast.error('Could not get your location')
      },
      { timeout: 10000 }
    )
  }

  const fetchNearby = async () => {
    if (!userLocation) {
      toast.error('Click "Use My Location" first')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(`/users/nearby?radius=${radius}`)
      setNearbyUsers(data.users || [])

      if (mapInstanceRef.current) {
        const { map, L } = mapInstanceRef.current
        updateMapMarkers(L, map, data.users || [])
      }

      if ((data.users || []).length === 0) {
        toast('No collaborators found within this radius. Try increasing it.', { icon: '🔍' })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const sendRequest = async (targetUser) => {
    try {
      await api.post('/users/send-collab-request', {
        receiver_id: targetUser.id,
        message: 'Hi! I found you nearby and would love to collaborate!'
      })
      toast.success(`Request sent to ${targetUser.name}!`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <MapPin size={24} className="text-indigo-600" /> Nearby Collaborators
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Find innovators near you — powered by OpenStreetMap (free, no API key)
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Search Settings</h3>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Radius: <span className="text-indigo-600 font-bold">{radius} km</span>
              </label>
              <input
                type="range" min={5} max={500} step={5} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 km</span><span>500 km</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={getLocation}
                disabled={locating}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Navigation size={14} />
                {locating ? 'Getting location...' : 'Use My Location'}
              </button>
              <button
                onClick={fetchNearby}
                disabled={loading || !userLocation}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <MapPin size={14} />
                {loading ? 'Searching...' : 'Find Nearby'}
              </button>
            </div>

            {!userLocation && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-700 font-medium">
                  📍 Click "Use My Location" to enable nearby search
                </p>
              </div>
            )}

            {userLocation && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-700 font-medium">
                  ✅ Location set: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>

          {nearbyUsers.length > 0 && (
            <div className="card p-4 text-center">
              <p className="text-3xl font-black gradient-text">{nearbyUsers.length}</p>
              <p className="text-sm text-slate-500 mt-1">
                collaborators within {radius} km
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Map Legend</p>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm flex-shrink-0" />
              You
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-3 h-3 rounded-full bg-violet-500 border-2 border-white shadow-sm flex-shrink-0" />
              Nearby collaborators
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Click any marker to see details
            </p>
          </div>
        </div>

        {/* Map + Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Leaflet Map */}
          <div className="card overflow-hidden">
            <div
              ref={mapRef}
              className="w-full"
              style={{ height: '340px', zIndex: 0 }}
            />
          </div>

          {/* User cards */}
          {loading ? (
            <LoadingSpinner />
          ) : nearbyUsers.length > 0 ? (
            <>
              <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users size={15} className="text-indigo-500" />
                {nearbyUsers.length} collaborators found
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {nearbyUsers.map(u => (
                  <div key={u.id} className="relative">
                    <UserCard user={u} showConnect onConnect={sendRequest} />
                    <span className="absolute top-3 right-3 badge badge-success text-xs">
                      📍 {u.distance_km} km
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card p-10 text-center">
              <MapPin size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No results yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Set your location and click "Find Nearby" to discover collaborators
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
