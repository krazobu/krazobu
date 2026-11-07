import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/** Animates from 0 to `value` once visible, then eases towards later values. */
export function CountUp({ value, decimals = 0, duration = 1600, prefix = '', suffix = '', className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  const started = useRef(false)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const handle = { frame: 0 }

    const animate = (to: number, ms: number) => {
      if (reduceMotion) {
        shown.current = to
        setDisplay(to)
        return
      }
      const from = shown.current
      const start = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / ms)
        shown.current = from + (to - from) * easeOut(progress)
        setDisplay(shown.current)
        if (progress < 1) handle.frame = requestAnimationFrame(step)
      }
      cancelAnimationFrame(handle.frame)
      handle.frame = requestAnimationFrame(step)
    }

    if (started.current) {
      animate(value, 700)
      return () => cancelAnimationFrame(handle.frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        started.current = true
        observer.disconnect()
        animate(value, duration)
      },
      { threshold: 0.3 },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(handle.frame)
    }
  }, [value, duration])

  const text = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(display)
  return (
    <span ref={ref} className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  )
}
