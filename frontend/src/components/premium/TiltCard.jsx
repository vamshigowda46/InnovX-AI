import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

export default function TiltCard({ children, className = '', intensity = 12 }) {
  const ref = useRef(null)
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)')

  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(
      `perspective(1000px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) translateZ(8px)`
    )
  }

  const handleLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)')
  }

  return (
    <motion.div
      ref={ref}
      className={`card-3d ${className}`}
      style={{ transform, transition: 'transform 0.15s ease-out' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}
