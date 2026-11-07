import { useEffect, useRef } from 'react'

const COLORS = ['52,211,153', '244,114,182', '56,189,248', '226,232,240', '52,211,153']

type Streak = { x: number; y: number; len: number; speed: number; width: number; color: string; alpha: number }

/** Canvas "tunnel" of light streaks: lines near the vertical edges are closer and faster. */
export function SpeedLines({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const state = { width: 0, height: 0, frame: 0, streaks: [] as Streak[] }

    const spawn = (initial = false): Streak => {
      const { width, height } = state
      const y = Math.random() * height
      const depth = Math.abs(y - height / 2) / (height / 2) // 0 = horizon, 1 = edge
      return {
        x: initial ? Math.random() * width : -200 - Math.random() * width * 0.4,
        y,
        len: 60 + depth * 320 + Math.random() * 80,
        speed: 2.5 + depth * 16 + Math.random() * 3,
        width: 0.5 + depth * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.08 + depth * 0.55,
      }
    }

    const resize = () => {
      state.width = canvas.clientWidth
      state.height = canvas.clientHeight
      canvas.width = Math.floor(state.width * dpr)
      canvas.height = Math.floor(state.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(200, Math.max(50, Math.round((state.width * state.height) / 9000)))
      state.streaks = Array.from({ length: count }, () => spawn(true))
    }

    const draw = () => {
      ctx.clearRect(0, 0, state.width, state.height)
      for (const s of state.streaks) {
        const gradient = ctx.createLinearGradient(s.x, 0, s.x + s.len, 0)
        gradient.addColorStop(0, `rgba(${s.color},0)`)
        gradient.addColorStop(1, `rgba(${s.color},${s.alpha})`)
        ctx.strokeStyle = gradient
        ctx.lineWidth = s.width
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x + s.len, s.y)
        ctx.stroke()
        s.x += s.speed
        if (s.x > state.width + 40) Object.assign(s, spawn())
      }
      if (!reduceMotion) state.frame = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(state.frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
