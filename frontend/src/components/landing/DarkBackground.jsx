import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function DarkBackground() {
  const [mouse, setMouse] = useState({ x: 50, y: 50 })

  useEffect(() => {
    const onMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#050816]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124, 58, 237, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 58, 237, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-700 ease-out"
        style={{
          left: `${mouse.x}%`,
          top: `${mouse.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
        }}
      />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-violet-600/25 rounded-full blur-[100px] animate-float" />
      <div className="absolute top-1/3 -right-40 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[90px] animate-float" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/10 rounded-full blur-[80px]" />

      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/40"
          style={{
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 10) % 100}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -20, 0] }}
          transition={{ duration: 3 + (i % 5), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}
