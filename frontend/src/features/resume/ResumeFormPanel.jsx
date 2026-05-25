import { useState } from 'react'
import { ChevronDown, Plus, Trash2, Upload, Eye, EyeOff } from 'lucide-react'

function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white/80">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-slate-800 hover:bg-violet-50/50 transition-colors">
        {title}
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-slate-100">{children}</div>}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-violet-300/40 focus:border-violet-400 outline-none'

export default function ResumeFormPanel({ data, setData, onAiEnhance }) {
  const [open, setOpen] = useState({ basics: true, summary: false, education: false, skills: false, experience: false, projects: false, certs: false, other: false })

  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }))
  const setBasics = (patch) => setData(d => ({ ...d, basics: { ...d.basics, ...patch } }))
  const updateList = (key, idx, patch) => setData(d => {
    const list = [...(d[key] || [])]
    list[idx] = { ...list[idx], ...patch }
    return { ...d, [key]: list }
  })
  const addItem = (key, item) => setData(d => ({ ...d, [key]: [...(d[key] || []), item] }))
  const removeItem = (key, idx) => setData(d => ({ ...d, [key]: (d[key] || []).filter((_, i) => i !== idx) }))

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBasics({ photo: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3 p-4 overflow-y-auto h-full">
      <Accordion title="Basic Information" open={open.basics} onToggle={() => toggle('basics')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name"><input className={inputCls} value={data.basics?.name || ''} onChange={e => setBasics({ name: e.target.value })} /></Field>
          <Field label="Role / Title"><input className={inputCls} value={data.basics?.role || ''} onChange={e => setBasics({ role: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} value={data.basics?.email || ''} onChange={e => setBasics({ email: e.target.value })} /></Field>
          <Field label="Phone"><input className={inputCls} value={data.basics?.phone || ''} onChange={e => setBasics({ phone: e.target.value })} /></Field>
          <Field label="LinkedIn"><input className={inputCls} value={data.basics?.linkedin || ''} onChange={e => setBasics({ linkedin: e.target.value })} /></Field>
          <Field label="GitHub"><input className={inputCls} value={data.basics?.github || ''} onChange={e => setBasics({ github: e.target.value })} /></Field>
          <Field label="Portfolio"><input className={inputCls} value={data.basics?.portfolio || ''} onChange={e => setBasics({ portfolio: e.target.value })} /></Field>
          <Field label="Address"><input className={inputCls} value={data.basics?.address || ''} onChange={e => setBasics({ address: e.target.value })} /></Field>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-violet-300 text-sm text-violet-600 cursor-pointer hover:bg-violet-50">
            <Upload size={16} /> Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <button type="button" onClick={() => setBasics({ showPhoto: !data.basics?.showPhoto })} className="text-sm text-slate-500 flex items-center gap-1">
            {data.basics?.showPhoto ? <EyeOff size={14} /> : <Eye size={14} />} {data.basics?.showPhoto ? 'Hide' : 'Show'} photo
          </button>
        </div>
      </Accordion>

      <Accordion title="Summary" open={open.summary} onToggle={() => toggle('summary')}>
        <textarea className={`${inputCls} min-h-[100px]`} value={data.summary || ''} onChange={e => setData(d => ({ ...d, summary: e.target.value }))} placeholder="Professional summary..." />
        {onAiEnhance && (
          <button type="button" onClick={() => onAiEnhance('summary')} className="text-xs text-violet-600 font-semibold">✨ AI Enhance Summary</button>
        )}
      </Accordion>

      <Accordion title="Skills" open={open.skills} onToggle={() => toggle('skills')}>
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.skills || []).map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs">
              {typeof s === 'string' ? s : s}
              <button type="button" onClick={() => removeItem('skills', i)}><Trash2 size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputCls} id="skill-add" placeholder="Add skill" onKeyDown={e => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              addItem('skills', e.target.value.trim())
              e.target.value = ''
            }
          }} />
        </div>
      </Accordion>

      <Accordion title="Experience" open={open.experience} onToggle={() => toggle('experience')}>
        {(data.experience || []).map((ex, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-50 space-y-2 relative">
            <button type="button" className="absolute top-2 right-2 text-red-400" onClick={() => removeItem('experience', i)}><Trash2 size={14} /></button>
            <input className={inputCls} placeholder="Company" value={ex.company || ''} onChange={e => updateList('experience', i, { company: e.target.value })} />
            <input className={inputCls} placeholder="Role" value={ex.role || ''} onChange={e => updateList('experience', i, { role: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder="Start" value={ex.start || ''} onChange={e => updateList('experience', i, { start: e.target.value })} />
              <input className={inputCls} placeholder="End" value={ex.end || ''} onChange={e => updateList('experience', i, { end: e.target.value })} />
            </div>
            <textarea className={inputCls} placeholder="Bullet points (one per line)" value={(ex.bullets || []).join('\n')} onChange={e => updateList('experience', i, { bullets: e.target.value.split('\n').filter(Boolean) })} rows={3} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('experience', { company: '', role: '', start: '', end: '', bullets: [] })} className="flex items-center gap-1 text-sm text-violet-600 font-semibold"><Plus size={14} /> Add Experience</button>
      </Accordion>

      <Accordion title="Education" open={open.education} onToggle={() => toggle('education')}>
        {(data.education || []).map((ed, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg relative">
            <button type="button" className="absolute top-1 right-1 text-red-400" onClick={() => removeItem('education', i)}><Trash2 size={12} /></button>
            <input className={inputCls} placeholder="School" value={ed.school || ''} onChange={e => updateList('education', i, { school: e.target.value })} />
            <input className={inputCls} placeholder="Degree" value={ed.degree || ''} onChange={e => updateList('education', i, { degree: e.target.value })} />
            <input className={inputCls} placeholder="Year" value={ed.year || ''} onChange={e => updateList('education', i, { year: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('education', { school: '', degree: '', year: '' })} className="flex items-center gap-1 text-sm text-violet-600 font-semibold"><Plus size={14} /> Add Education</button>
      </Accordion>

      <Accordion title="Projects" open={open.projects} onToggle={() => toggle('projects')}>
        {(data.projects || []).map((p, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            <button type="button" className="absolute top-2 right-2 text-red-400" onClick={() => removeItem('projects', i)}><Trash2 size={14} /></button>
            <input className={inputCls} placeholder="Project name" value={p.name || ''} onChange={e => updateList('projects', i, { name: e.target.value })} />
            <textarea className={inputCls} placeholder="Description" value={p.desc || ''} onChange={e => updateList('projects', i, { desc: e.target.value })} rows={2} />
            <input className={inputCls} placeholder="Tech stack" value={p.tech || ''} onChange={e => updateList('projects', i, { tech: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('projects', { name: '', desc: '', tech: '' })} className="flex items-center gap-1 text-sm text-violet-600 font-semibold"><Plus size={14} /> Add Project</button>
      </Accordion>

      <Accordion title="Certifications & More" open={open.certs} onToggle={() => toggle('certs')}>
        {(data.certifications || []).map((c, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-lg">
            <input className={inputCls} placeholder="Name" value={c.name || c.title || ''} onChange={e => updateList('certifications', i, { name: e.target.value })} />
            <input className={inputCls} placeholder="Issuer" value={c.issuer || ''} onChange={e => updateList('certifications', i, { issuer: e.target.value })} />
          </div>
        ))}
        <button type="button" onClick={() => addItem('certifications', { name: '', issuer: '', date: '' })} className="flex items-center gap-1 text-sm text-violet-600 font-semibold mb-3"><Plus size={14} /> Add Certification</button>
        <Field label="Languages (comma separated)">
          <input className={inputCls} value={(data.languages || []).join(', ')} onChange={e => setData(d => ({ ...d, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
        </Field>
        <Field label="Interests (comma separated)">
          <input className={inputCls} value={(data.interests || []).join(', ')} onChange={e => setData(d => ({ ...d, interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
        </Field>
      </Accordion>
    </div>
  )
}
