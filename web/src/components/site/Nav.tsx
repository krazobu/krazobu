import { useEffect, useState } from 'react'

import { Link } from '../Link'
import { Logo } from '../Logo'

const links = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#tokenomics', label: 'Tokenomics' },
  { href: '/#pools', label: 'Pools' },
  { href: '/#faq', label: 'FAQ' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? 'border-b border-white/5 bg-rail-950/70 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <Logo />
          <div className="leading-tight">
            <div className="font-display text-lg font-extrabold tracking-tight">Shinkanshen</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-shk-300/80">BNB Smart Chain</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Site">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link to="/app" className="btn-primary">
          Launch App
        </Link>
      </div>
    </header>
  )
}
