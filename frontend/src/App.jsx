import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Landing from './pages/landing/Landing'
import NotFound from './pages/NotFound'
import api from './utils/api'
import { LoadingSpinner } from './components/ui/Cards'
import ErrorBoundary from './components/ui/ErrorBoundary'

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Projects = lazy(() => import('./pages/projects/Projects'))
const ProjectDetail = lazy(() => import('./pages/projects/ProjectDetail'))
const Startups = lazy(() => import('./pages/startups/Startups'))
const TeamMatch = lazy(() => import('./pages/dashboard/TeamMatch'))
const Messages = lazy(() => import('./pages/messages/Messages'))
const Mentors = lazy(() => import('./pages/mentors/Mentors'))
const Events = lazy(() => import('./pages/events/Events'))
const AITools = lazy(() => import('./pages/ai/AITools'))
const Copilot = lazy(() => import('./pages/ai/Copilot'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const Leaderboard = lazy(() => import('./pages/dashboard/Leaderboard'))
const NearbyCollaborators = lazy(() => import('./pages/dashboard/NearbyCollaborators'))
const InnovationFeed = lazy(() => import('./pages/feed/InnovationFeed'))
const CollaborationHub = lazy(() => import('./pages/collaboration/CollaborationHub'))
const ResumeBuilder = lazy(() => import('./pages/resume/ResumeBuilder'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center premium-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full animate-spin border-2 border-violet-200 border-t-violet-600" />
          <p className="text-slate-500 text-sm font-medium">Loading InnovX AI...</p>
        </div>
      </div>
    )
  }
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </Layout>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center premium-bg">
        <div className="w-10 h-10 rounded-full animate-spin border-2 border-violet-200 border-t-violet-600" />
      </div>
    )
  }
  return user ? <Navigate to="/dashboard" replace /> : children
}

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center premium-bg">
        <div className="w-10 h-10 rounded-full animate-spin border-2 border-violet-200 border-t-violet-600" />
      </div>
    )
  }
  return user ? <Navigate to="/dashboard" replace /> : <Landing />
}

function StartupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/startups/${id}`)
      .then(({ data }) => setStartup(data.startup))
      .catch(() => navigate('/startups'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) return <LoadingSpinner size="lg" />
  if (!startup) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {startup.logo ? <img src={startup.logo} className="w-16 h-16 rounded-2xl object-cover" alt="" /> : startup.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-800">{startup.name}</h1>
              <span className={`badge ${startup.stage === 'idea' ? 'badge-primary' : startup.stage === 'mvp' ? 'badge-warning' : startup.stage === 'seed' ? 'badge-success' : 'badge-purple'}`}>{startup.stage}</span>
            </div>
            <p className="text-slate-500 mb-2">{startup.tagline}</p>
            <span className="badge badge-primary">{startup.domain}</span>
          </div>
          {startup.is_hiring && <span className="badge badge-success">Hiring</span>}
        </div>
        <p className="text-slate-700 mb-4">{startup.description}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {startup.funding_goal && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="font-bold text-emerald-700">${startup.funding_goal?.toLocaleString()}</p>
              <p className="text-emerald-600 text-xs">Funding Goal</p>
            </div>
          )}
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <p className="font-bold text-indigo-700">{startup.team_size}</p>
            <p className="text-indigo-600 text-xs">Team Size</p>
          </div>
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <p className="font-bold text-violet-700">{startup.likes}</p>
            <p className="text-violet-600 text-xs">Likes</p>
          </div>
        </div>
      </div>

      {startup.looking_for?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-3">Looking For</h3>
          <div className="flex flex-wrap gap-2">
            {startup.looking_for.map(r => <span key={r} className="badge badge-warning">{r}</span>)}
          </div>
        </div>
      )}

      {startup.required_skills?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-800 mb-3">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {startup.required_skills.map(s => <span key={s} className="badge badge-primary">{s}</span>)}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => api.post(`/startups/${id}/like`).then(() => toast.success('Liked!')).catch(() => {})}
          className="btn-secondary flex items-center gap-2">Like</button>
        {startup.founder_id !== user?.id && (
          <button onClick={() => api.post('/users/send-collab-request', { receiver_id: startup.founder_id, message: `I'm interested in joining ${startup.name}!` }).then(() => toast.success('Request sent!')).catch(e => toast.error(e.userMessage || 'Failed'))}
            className="btn-primary">Apply to Join</button>
        )}
        {startup.website && (
          <a href={startup.website} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2">Website</a>
        )}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><InnovationFeed /></ProtectedRoute>} />
      <Route path="/collaboration" element={<ProtectedRoute><CollaborationHub /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/startups" element={<ProtectedRoute><Startups /></ProtectedRoute>} />
      <Route path="/startups/:id" element={<ProtectedRoute><StartupDetail /></ProtectedRoute>} />
      <Route path="/team-match" element={<ProtectedRoute><TeamMatch /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/mentors" element={<ProtectedRoute><Mentors /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
      <Route path="/ai-tools" element={<Navigate to="/tools" replace />} />
      <Route path="/copilot" element={<ProtectedRoute><Copilot /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/nearby" element={<ProtectedRoute><NearbyCollaborators /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#fff',
                color: '#0f172a',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.12)',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
