import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api, { getAiErrorMessage } from '../../utils/api'
import toast from 'react-hot-toast'
import ResumeToolbar from '../../features/resume/ResumeToolbar'
import ResumeFormPanel from '../../features/resume/ResumeFormPanel'
import ResumePreview from '../../features/resume/ResumePreview'
import { emptyResume, resumeCompletion } from '../../features/resume/resumeDefaults'
import { exportResumePDF, exportResumePNG, printResume } from '../../features/resume/exportResume'
import { LoadingSpinner } from '../../components/ui/Cards'

export default function ResumeBuilder() {
  const { user } = useAuth()
  const [data, setData] = useState(emptyResume(user))
  const [template, setTemplate] = useState('modern-blue')
  const [font, setFont] = useState('inter')
  const [theme, setTheme] = useState('blue')
  const [resumeId, setResumeId] = useState(null)
  const [activeTab, setActiveTab] = useState('form')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const previewRef = useRef(null)

  useEffect(() => {
    api.get('/career/resumes/primary')
      .then(({ data: res }) => {
        if (res.resume) {
          setData(res.resume.content || emptyResume(user))
          setTemplate(res.resume.template || 'modern-blue')
          setFont(res.resume.font || 'inter')
          setTheme(res.resume.theme || 'blue')
          setResumeId(res.resume.id)
        } else if (res.default_content) {
          setData({ ...emptyResume(user), ...res.default_content })
        }
      })
      .catch(() => setData(emptyResume(user)))
      .finally(() => setLoading(false))
  }, [user])

  const completion = resumeCompletion(data)

  const saveResume = async () => {
    setSaving(true)
    try {
      const { data: res } = await api.post('/career/resumes', {
        id: resumeId,
        content: data,
        template,
        font,
        theme,
        title: `${data.basics?.name || 'My'} Resume`,
        is_primary: true,
      })
      setResumeId(res.resume.id)
      toast.success('Resume saved!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const aiEnhance = async (section) => {
    try {
      const { data: ai } = await api.post('/ai/generate-resume')
      const c = ai.resume_content || ai.resume || ai.content || {}
      if (section === 'summary' && c.summary) setData(d => ({ ...d, summary: c.summary }))
      else setData(d => ({
        ...d,
        summary: c.summary || d.summary,
        skills: c.skills?.length ? c.skills : d.skills,
      }))
      toast.success('AI content applied!')
    } catch (err) {
      toast.error(getAiErrorMessage(err))
    }
  }

  const handlePdf = async () => {
    const el = document.getElementById('resume-preview-print')
    try {
      await exportResumePDF(el, `${data.basics?.name || 'resume'}.pdf`)
      toast.success('PDF downloaded')
    } catch {
      toast.error('PDF export failed')
    }
  }

  const handlePng = async () => {
    try {
      await exportResumePNG(document.getElementById('resume-preview-print'))
      toast.success('PNG downloaded')
    } catch {
      toast.error('PNG export failed')
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-slate-50 via-violet-50/30 to-cyan-50/20">
      <ResumeToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        template={template}
        setTemplate={setTemplate}
        font={font}
        setFont={setFont}
        theme={theme}
        setTheme={setTheme}
        onSave={saveResume}
        onPdf={handlePdf}
        onPng={handlePng}
        onPrint={() => printResume('resume-preview-print')}
        saving={saving}
        completion={completion}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-h-[calc(100vh-120px)]">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[42%] xl:w-[38%] border-r border-slate-200/80 bg-white/40 backdrop-blur-sm overflow-hidden flex flex-col"
        >
          {activeTab === 'form' ? (
            <ResumeFormPanel data={data} setData={setData} onAiEnhance={aiEnhance} />
          ) : (
            <div className="p-6 text-sm text-slate-600">
              <p className="font-semibold text-slate-800 mb-2">Use the toolbar above to switch {activeTab}.</p>
              <p>Changes apply instantly to the live preview on the right.</p>
            </div>
          )}
        </motion.div>

        <motion.div
          ref={previewRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-auto p-6 lg:p-8 bg-slate-100/50"
        >
          <div className="transform scale-[0.85] sm:scale-90 lg:scale-95 xl:scale-100 origin-top mx-auto">
            <ResumePreview data={data} template={template} font={font} theme={theme} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
