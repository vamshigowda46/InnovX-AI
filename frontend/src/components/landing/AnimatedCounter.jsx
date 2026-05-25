import { useEffect, useState, useRef } from 'react'
import { useInView } from 'framer-motion'

export default function AnimatedCounter({ end, suffix = '', duration = 1500, decimals = 0 }) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!inView) return
    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setN(end * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else setN(end)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, end, duration])

  const display = decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString()

  return (
    <span ref={ref}>
      {display}{suffix}
    </span>
  )
}
