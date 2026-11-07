import { useEffect, useState } from 'react'

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const root = document.documentElement
      setProgress(root.scrollTop / Math.max(1, root.scrollHeight - root.clientHeight))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return <div className="progress-bar" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
}
