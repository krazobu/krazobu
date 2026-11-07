import type { HTMLAttributes, MouseEvent } from 'react'

export function SpotlightCard({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }
  return (
    <div {...rest} onMouseMove={onMouseMove} className={`spotlight card ${className}`}>
      {children}
    </div>
  )
}
