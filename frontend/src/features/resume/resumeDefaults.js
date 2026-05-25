export const TEMPLATES = [
  { id: 'modern-blue', name: 'Modern Blue', accent: '#2563eb' },
  { id: 'minimal-white', name: 'Minimal White', accent: '#0f172a' },
  { id: 'dark-pro', name: 'Dark Professional', accent: '#7c3aed' },
  { id: 'gradient-tech', name: 'Gradient Tech', accent: '#06b6d4' },
]

export const FONTS = [
  { id: 'inter', label: 'Inter', family: 'Inter, sans-serif' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  { id: 'mono', label: 'Mono', family: 'ui-monospace, monospace' },
]

export const THEMES = [
  { id: 'blue', label: 'Blue', primary: '#2563eb' },
  { id: 'violet', label: 'Violet', primary: '#7c3aed' },
  { id: 'cyan', label: 'Cyan', primary: '#0891b2' },
  { id: 'rose', label: 'Rose', primary: '#e11d48' },
]

export function emptyResume(user = {}) {
  return {
    basics: {
      name: user.name || '',
      role: user.department || 'Software Engineer',
      email: user.email || '',
      phone: '',
      linkedin: user.linkedin_url || '',
      github: user.github_url || '',
      portfolio: user.portfolio_url || '',
      address: user.location || '',
      photo: user.avatar || '',
      showPhoto: true,
      photoPosition: { x: 50, y: 50 },
    },
    summary: user.bio || '',
    education: [],
    skills: user.skills || [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    interests: user.interests || [],
    social: [],
  }
}

export function resumeCompletion(data) {
  let score = 0
  const b = data.basics || {}
  if (b.name) score += 10
  if (b.email) score += 5
  if (data.summary?.length > 20) score += 15
  if (data.skills?.length) score += 10
  if (data.education?.length) score += 15
  if (data.experience?.length) score += 20
  if (data.projects?.length) score += 15
  if (data.certifications?.length) score += 10
  return Math.min(100, score)
}
