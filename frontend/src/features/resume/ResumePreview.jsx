import { FONTS, TEMPLATES, THEMES } from './resumeDefaults'

function Section({ title, children, dark }) {
  if (!children) return null
  return (
    <div className="mb-4">
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${dark ? 'text-violet-300' : 'text-slate-500'}`}>{title}</h3>
      {children}
    </div>
  )
}

export default function ResumePreview({ data, template, font, theme }) {
  const tpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0]
  const fnt = FONTS.find(f => f.id === font) || FONTS[0]
  const thm = THEMES.find(t => t.id === theme) || THEMES[0]
  const accent = thm.primary || tpl.accent
  const b = data.basics || {}
  const isDark = template === 'dark-pro'
  const isGradient = template === 'gradient-tech'
  const isMinimal = template === 'minimal-white'

  const headerStyle = isGradient
    ? { background: `linear-gradient(135deg, ${accent}, #7c3aed)`, color: '#fff' }
    : isDark
      ? { background: '#0f172a', color: '#fff' }
      : { borderBottom: `3px solid ${accent}`, color: '#0f172a' }

  return (
    <div
      id="resume-preview-print"
      className="mx-auto bg-white text-slate-800 shadow-2xl"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: fnt.family,
        fontSize: '11px',
        lineHeight: 1.45,
        padding: isGradient ? 0 : '14mm',
      }}
    >
      <div style={{ ...headerStyle, padding: isGradient ? '14mm' : '0 0 12px 0', marginBottom: '12px' }}>
        <div className="flex gap-4 items-start">
          {b.showPhoto && b.photo && (
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30"
              style={{ objectPosition: `${b.photoPosition?.x || 50}% ${b.photoPosition?.y || 50}%` }}
            >
              <img src={b.photo} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight">{b.name || 'Your Name'}</h1>
            <p className="text-sm opacity-90 mt-0.5 font-medium">{b.role || 'Professional Title'}</p>
            <div className={`flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] ${isDark || isGradient ? 'text-white/80' : 'text-slate-600'}`}>
              {b.email && <span>{b.email}</span>}
              {b.phone && <span>{b.phone}</span>}
              {b.linkedin && <span>{b.linkedin.replace(/^https?:\/\//, '')}</span>}
              {b.github && <span>{b.github.replace(/^https?:\/\//, '')}</span>}
              {b.portfolio && <span>{b.portfolio.replace(/^https?:\/\//, '')}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: isGradient ? '0 14mm 14mm' : 0 }}>
        {data.summary && (
          <Section title="Summary" dark={isDark}>
            <p className="text-slate-700 leading-relaxed">{data.summary}</p>
          </Section>
        )}

        {data.skills?.length > 0 && (
          <Section title="Skills" dark={isDark}>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: `${accent}18`, color: accent }}>
                  {typeof s === 'string' ? s : s.name || s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {data.experience?.length > 0 && (
          <Section title="Experience" dark={isDark}>
            {data.experience.map((ex, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-baseline">
                  <p className="font-bold text-slate-900">{ex.role || ex.title}</p>
                  <span className="text-[10px] text-slate-500">{ex.start} – {ex.end || 'Present'}</span>
                </div>
                <p className="text-xs font-medium" style={{ color: accent }}>{ex.company}</p>
                {(ex.bullets || []).map((bullet, j) => (
                  <p key={j} className="text-slate-600 text-[10px] mt-0.5 pl-2 border-l-2 border-slate-200">• {bullet}</p>
                ))}
              </div>
            ))}
          </Section>
        )}

        {data.education?.length > 0 && (
          <Section title="Education" dark={isDark}>
            {data.education.map((ed, i) => (
              <div key={i} className="mb-2">
                <p className="font-bold text-slate-900">{ed.school}</p>
                <p className="text-xs text-slate-600">{ed.degree} {ed.year && `· ${ed.year}`}</p>
              </div>
            ))}
          </Section>
        )}

        {data.projects?.length > 0 && (
          <Section title="Projects" dark={isDark}>
            {data.projects.map((p, i) => (
              <div key={i} className="mb-2">
                <p className="font-bold text-slate-900">{p.name}</p>
                <p className="text-[10px] text-slate-600">{p.desc}</p>
                {p.tech && <p className="text-[10px] mt-0.5" style={{ color: accent }}>{p.tech}</p>}
              </div>
            ))}
          </Section>
        )}

        {data.certifications?.length > 0 && (
          <Section title="Certifications" dark={isDark}>
            {data.certifications.map((c, i) => (
              <p key={i} className="text-[10px] text-slate-700 mb-1">
                <strong>{c.name || c.title}</strong> — {c.issuer} {c.date && `(${c.date})`}
              </p>
            ))}
          </Section>
        )}

        {(data.languages?.length > 0 || data.interests?.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {data.languages?.length > 0 && (
              <Section title="Languages" dark={isDark}>
                <p className="text-[10px]">{data.languages.join(', ')}</p>
              </Section>
            )}
            {data.interests?.length > 0 && (
              <Section title="Interests" dark={isDark}>
                <p className="text-[10px]">{data.interests.join(', ')}</p>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
