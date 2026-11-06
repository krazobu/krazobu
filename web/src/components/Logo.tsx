export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0b1220" />
      <path
        d="M10 40c6-14 16-22 30-22h12c2 0 2 3 0 3H42c-8 0-14 4-18 10h26c2 0 2 3 0 3H21c-1 2-2 4-2 6H10z"
        fill="#34d399"
      />
      <path d="M10 46h44" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 52h28" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}
