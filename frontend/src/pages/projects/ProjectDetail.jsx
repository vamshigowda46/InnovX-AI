import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'
import { LoadingSpinner, SkillBadge, ProgressBar, Modal } from '../../components/ui/Cards'
import { getInitials, timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Github, ExternalLink, Users, Plus, Trash2, Edit3, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const TASK_STATUSES = ['todo', 'in_progress', 'done']
const STATUS_ICONS = { todo: <Clock size={14} />, in_progress: <AlertCircle size={14} />, done: <CheckCircle size={14} /> }
const STATUS_COLORS = { todo: 'bg-slate-100 text-slate-600', in_progress: 'bg-amber-100 text-amber-700', done: 'bg-emerald-100 text-emerald-700' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo' })
  const [editProgress, setEditProgress] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => { fetchProject() }, [id])

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`)
      setProject(data.project)
      setProgress(data.project.progress || 0)
    } catch { toast.error('Project not found'); navigate('/projects') }
    finally { setLoading(false) }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${id}/tasks`, taskForm)
      toast.success('Task created!')
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo' })
      fetchProject()
    } catch { toast.error('Failed to create task') }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/projects/tasks/${taskId}`, { status })
      fetchProject()
    } catch {}
  }

  const deleteTask = async (taskId) => {
    try {
      await api.delete(`/projects/tasks/${taskId}`)
      fetchProject()
    } catch {}
  }

  const updateProgress = async () => {
    try {
      await api.put(`/projects/${id}`, { progress })
      toast.success('Progress updated!')
      setEditProgress(false)
      fetchProject()
    } catch {}
  }

  const joinProject = async () => {
    try {
      await api.post(`/projects/${id}/join`, { role: 'Member' })
      toast.success('Joined project!')
      fetchProject()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to join') }
  }

  if (loading) return <LoadingSpinner size="lg" />
  if (!project) return null

  const isOwner = project.owner_id === user?.id
  const isMember = project.members?.some(m => m.user?.id === user?.id)
  const todoTasks = project.tasks?.filter(t => t.status === 'todo') || []
  const inProgressTasks = project.tasks?.filter(t => t.status === 'in_progress') || []
  const doneTasks = project.tasks?.filter(t => t.status === 'done') || []

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-slate-800">{project.title}</h1>
              <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'completed' ? 'badge-primary' : 'badge-warning'}`}>{project.status}</span>
              {project.ai_generated && <span className="badge badge-purple">✨ AI Generated</span>}
            </div>
            <p className="text-slate-600 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tech_stack?.map(t => <SkillBadge key={t} skill={t} />)}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-800"><Github size={15} /> GitHub</a>}
              {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-800"><ExternalLink size={15} /> Demo</a>}
              <span className="flex items-center gap-1.5"><Users size={15} /> {project.team_size} members</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {!isMember && project.looking_for_members && (
              <button onClick={joinProject} className="btn-primary text-sm">Join Project</button>
            )}
            {isOwner && (
              <button onClick={() => setEditProgress(true)} className="btn-secondary text-sm">Update Progress</button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span className="font-medium">Project Progress</span>
            <span className="font-bold">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kanban Board */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Task Board</h2>
            {(isOwner || isMember) && (
              <button onClick={() => setShowTaskModal(true)} className="btn-primary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['todo', todoTasks], ['in_progress', inProgressTasks], ['done', doneTasks]].map(([status, tasks]) => (
              <div key={status} className="bg-slate-50 rounded-xl p-3">
                <div className={`flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg w-fit ${STATUS_COLORS[status]}`}>
                  {STATUS_ICONS[status]}
                  <span className="text-xs font-semibold capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-xs">({tasks.length})</span>
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
                      <p className="text-sm font-medium text-slate-800 mb-1">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className={`badge text-xs ${task.priority === 'high' ? 'badge-danger' : task.priority === 'medium' ? 'badge-warning' : 'badge-success'}`}>{task.priority}</span>
                        <div className="flex gap-1">
                          {status !== 'done' && (
                            <button onClick={() => updateTaskStatus(task.id, status === 'todo' ? 'in_progress' : 'done')}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">→</button>
                          )}
                          {isOwner && <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Team */}
          <div className="card p-4">
            <h3 className="font-bold text-slate-800 mb-3">Team Members</h3>
            <div className="space-y-2">
              {project.members?.map(m => (
                <div key={m.user?.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {m.user?.avatar ? <img src={m.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" /> : getInitials(m.user?.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.user?.name}</p>
                    <p className="text-xs text-slate-400">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {project.milestones?.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-slate-800 mb-3">Milestones</h3>
              <div className="space-y-2">
                {project.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                    <span className="text-slate-700">{typeof m === 'object' ? m.title : m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Domain</span><span className="font-medium">{project.domain}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Difficulty</span><span className="font-medium capitalize">{project.difficulty}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Views</span><span className="font-medium">{project.views}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-medium">{timeAgo(project.created_at)}</span></div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        <form onSubmit={createTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task Title *</label>
            <input className="input" placeholder="Task name" value={taskForm.title}
              onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={2} value={taskForm.description}
              onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select className="input" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select className="input" value={taskForm.status} onChange={e => setTaskForm(p => ({ ...p, status: e.target.value }))}>
                {TASK_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowTaskModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Add Task</button>
          </div>
        </form>
      </Modal>

      {/* Progress Modal */}
      <Modal isOpen={editProgress} onClose={() => setEditProgress(false)} title="Update Progress" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Progress: {progress}%</label>
            <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))} className="w-full accent-indigo-600" />
            <ProgressBar value={progress} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditProgress(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={updateProgress} className="btn-primary flex-1">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
