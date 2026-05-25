import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Award, Plus, Download, Eye, Trash2, X, Upload, ExternalLink } from 'lucide-react'

export default function CertificateManager({ userId, editable = true }) {
  const [certs, setCerts] = useState([])
  const [stats, setStats] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', issuer: '', issue_date: '', credential_url: '', description: '', skill_tags: [] })
  const [filePreview, setFilePreview] = useState('')

  const load = () => {
    const q = userId ? `?user_id=${userId}` : ''
    Promise.all([
      api.get(`/career/certificates${q}`),
      editable ? api.get('/career/certificates/stats') : Promise.resolve({ data: {} }),
    ]).then(([c, s]) => {
      setCerts(c.data.certificates || [])
      setStats(s.data || { total: c.data.certificates?.length || 0 })
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [userId])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setFilePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title required')
    try {
      await api.post('/career/certificates', { ...form, file_url: filePreview, skill_tags: form.skill_tags })
      toast.success('Certificate added!')
      setShowForm(false)
      setForm({ title: '', issuer: '', issue_date: '', credential_url: '', description: '', skill_tags: [] })
      setFilePreview('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this certificate?')) return
    try {
      await api.delete(`/career/certificates/${id}`)
      toast.success('Removed')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const fileSrc = (url) => {
    if (!url) return null
    if (url.startsWith('data:') || url.startsWith('http')) return url
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')
    return `${base}${url}`
  }

  if (loading) return <div className="py-12 text-center text-slate-400">Loading certificates...</div>

  return (
    <div className="space-y-6">
      {editable && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-black gradient-text">{stats.total || certs.length}</p>
            <p className="text-xs text-slate-500 mt-1">Certificates</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-amber-600">{stats.verified_badges || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Achievement Badges</p>
          </div>
          <div className="card p-4 col-span-2 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Build your credential portfolio</p>
              <p className="text-xs text-slate-500">Upload and showcase certifications</p>
            </div>
            <button type="button" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Add Certificate
            </button>
          </div>
        </div>
      )}

      {certs.length === 0 ? (
        <div className="card p-12 text-center">
          <Award className="mx-auto text-violet-300 mb-3" size={48} />
          <p className="text-slate-600 font-medium">No certificates yet</p>
          {editable && <p className="text-sm text-slate-400 mt-1">Add your first credential to stand out</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="card overflow-hidden group border border-violet-100/80 hover:shadow-lg hover:border-violet-200 transition-all"
            >
              <div className="h-32 bg-gradient-to-br from-violet-50 to-cyan-50 flex items-center justify-center relative overflow-hidden">
                {c.file_url ? (
                  <img src={fileSrc(c.file_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Award size={40} className="text-violet-400" />
                )}
                <div className="absolute inset-0 bg-violet-900/0 group-hover:bg-violet-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => setPreview(c)} className="p-2 rounded-lg bg-white text-violet-700"><Eye size={16} /></button>
                  {c.file_url && (
                    <a href={fileSrc(c.file_url)} download className="p-2 rounded-lg bg-white text-violet-700"><Download size={16} /></a>
                  )}
                  {editable && (
                    <button type="button" onClick={() => remove(c.id)} className="p-2 rounded-lg bg-white text-red-600"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-800 line-clamp-1">{c.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{c.issuer}</p>
                {c.issue_date && <p className="text-[10px] text-violet-600 mt-1">{c.issue_date}</p>}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(c.skill_tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              onSubmit={submit} className="glass-premium rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Add Certificate</h3>
                <button type="button" onClick={() => setShowForm(false)}><X size={20} /></button>
              </div>
              <input className="input" placeholder="Certificate title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              <input className="input" placeholder="Issuer (Google, AWS, etc.)" value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} />
              <input className="input" placeholder="Issue date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
              <input className="input" placeholder="Credential URL" value={form.credential_url} onChange={e => setForm(f => ({ ...f, credential_url: e.target.value }))} />
              <textarea className="input min-h-[80px]" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-violet-300 rounded-xl cursor-pointer text-sm text-violet-600">
                <Upload size={16} /> Upload certificate image/PDF preview
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              </label>
              <button type="submit" className="btn-primary w-full py-3">Save Certificate</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setPreview(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{preview.title}</h3>
                  <p className="text-slate-500">{preview.issuer} · {preview.issue_date}</p>
                </div>
                <button type="button" onClick={() => setPreview(null)}><X size={22} /></button>
              </div>
              {preview.file_url && <img src={fileSrc(preview.file_url)} alt="" className="w-full rounded-xl mb-4" />}
              <p className="text-slate-600 text-sm">{preview.description}</p>
              {preview.credential_url && (
                <a href={preview.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-600 text-sm mt-3">
                  <ExternalLink size={14} /> View credential
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
