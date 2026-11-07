import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  as?: keyof HTMLElementTagNameMap
  id?: string
}

/** Fades/slides children in the first time they scroll into view. */
export function Reveal({ children, className = '', delay = 0, as = 'div', id }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return createElement(
    as,
    { ref, id, className: `reveal ${className}`, style: { '--reveal-delay': `${delay}ms` } as CSSProperties },
    children,
  )
}
