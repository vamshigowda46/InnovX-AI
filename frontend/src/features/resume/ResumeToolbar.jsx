import { FileText, Layout, Type, Palette, Download, Save, Sparkles } from 'lucide-react'
import { TEMPLATES, FONTS, THEMES } from './resumeDefaults'

const tabs = [
  { id: 'form', icon: FileText, label: 'Form' },
  { id: 'templates', icon: Layout, label: 'Templates' },
  { id: 'fonts', icon: Type, label: 'Fonts' },
  { id: 'colors', icon: Palette, label: 'Theme' },
]

export default function ResumeToolbar({
  activeTab, setActiveTab, template, setTemplate, font, setFont, theme, setTheme,
  onSave, onPdf, onPng, onPrint, saving, completion,
}) {
  return (
    <div className="sticky top-0 z-20 px-4 py-3">
      <div className="max-w-6xl mx-auto glass-premium rounded-2xl border border-violet-200/50 shadow-lg shadow-violet-100/50 px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 mr-2">
          <Sparkles size={18} className="text-violet-600" />
          <span className="font-bold text-slate-800 text-sm hidden sm:inline">Resume Studio</span>
          <span className="text-xs text-violet-600 font-semibold ml-2">{completion}%</span>
        </div>

        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === t.id ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-violet-50'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'templates' && (
          <div className="flex gap-2 flex-wrap">
            {TEMPLATES.map(t => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                className={`px-2 py-1 rounded-lg text-xs border ${template === t.id ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200'}`}>
                {t.name}
              </button>
            ))}
          </div>
        )}
        {activeTab === 'fonts' && (
          <select value={font} onChange={e => setFont(e.target.value)} className="text-xs rounded-lg border border-slate-200 px-2 py-1.5">
            {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        )}
        {activeTab === 'colors' && (
          <div className="flex gap-1">
            {THEMES.map(t => (
              <button key={t.id} type="button" title={t.label} onClick={() => setTheme(t.id)}
                className={`w-6 h-6 rounded-full border-2 ${theme === t.id ? 'border-slate-800 scale-110' : 'border-white'}`}
                style={{ background: t.primary }} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={onPrint} className="btn-secondary text-xs py-1.5 px-3 hidden sm:inline-flex">Print</button>
          <button type="button" onClick={onPng} className="btn-secondary text-xs py-1.5 px-3 hidden md:inline-flex">PNG</button>
          <button type="button" onClick={onPdf} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
            <Download size={14} /> PDF
          </button>
          <button type="button" onClick={onSave} disabled={saving} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1">
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
