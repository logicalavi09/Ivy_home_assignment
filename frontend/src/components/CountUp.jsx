import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

export default function CountUp({ to, format, duration = 1.1, start = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-30px' })
  const [value, setValue] = useState(start)

  useEffect(() => {
    if (!inView) return undefined
    const controls = animate(start, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (next) => setValue(Math.round(next)),
    })
    return () => controls.stop()
  }, [inView, start, to, duration])

  const rendered = typeof format === 'function' ? format(value) : value.toLocaleString('en-IN')
  return (
    <span ref={ref} className="count-up">
      {rendered}
    </span>
  )
}