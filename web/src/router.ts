import { useSyncExternalStore } from 'react'

const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
  listeners.add(callback)
  window.addEventListener('popstate', callback)
  return () => {
    listeners.delete(callback)
    window.removeEventListener('popstate', callback)
  }
}

export function scrollToHash(hash: string) {
  if (!hash) return
  document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function navigate(to: string) {
  const url = new URL(to, window.location.href)
  if (url.href === window.location.href) {
    if (url.hash) scrollToHash(url.hash)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  window.history.pushState({}, '', url)
  for (const listener of listeners) listener()
  if (!url.hash) window.scrollTo({ top: 0 })
}

/** Current pathname + hash, updated on navigate() and browser back/forward. */
export function useLocation() {
  return useSyncExternalStore(subscribe, () => window.location.pathname + window.location.hash)
}
