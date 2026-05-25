import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  { name: 'Priya Sharma', role: 'Founder, Nova Labs', avatar: 'PS', text: 'InnovX AI feels like a funded startup product. Our team ships MVPs 3× faster with the collaboration hub and AI tools.', stars: 5 },
  { name: 'Arjun Patel', role: 'CTO, Campus Ventures', avatar: 'AP', text: 'The analytics and teammate matching are unmatched for student innovation ecosystems. Genuinely premium UX.', stars: 5 },
  { name: 'Maya Chen', role: 'Innovation Director', avatar: 'MC', text: 'We replaced three fragmented tools with InnovX. Accepting collab invites actually works—huge win for our program.', stars: 5 },
]

export default function TestimonialsCarousel() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(t)
  }, [])

  const t = testimonials[idx]

  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-black text-white text-center mb-12"
        >
          Trusted by innovators
        </motion.h2>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="dark-glass-card p-8 sm:p-10 border border-violet-500/20"
            >
              <Quote className="text-violet-500/40 mb-4" size={32} />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg text-slate-300 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => setIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
              className="dark-btn-ghost p-2 rounded-lg"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2 items-center">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-cyan-400 w-6' : 'bg-slate-600'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIdx(i => (i + 1) % testimonials.length)}
              className="dark-btn-ghost p-2 rounded-lg"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
