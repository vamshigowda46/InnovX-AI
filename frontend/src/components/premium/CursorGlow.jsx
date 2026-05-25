import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY })
      setVisible(true)
    }
    const leave = () => setVisible(false)
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
    }
  }, [])

  if (!visible) return null

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] mix-blend-multiply"
      animate={{ x: pos.x - 150, y: pos.y - 150 }}
      transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.5 }}
    >
      <div
        className="w-[300px] h-[300px] rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)' }}
      />
    </motion.div>
  )
}
