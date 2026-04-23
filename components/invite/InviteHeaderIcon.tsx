type PortalContext = 'interpreter' | 'requester' | 'deaf' | 'public'

export function InviteHeaderIcon({ portal = 'public' }: { portal?: PortalContext }) {
  const color = portal === 'deaf' ? '#a78bfa' : '#00e5ff'
  return (
    <div
      className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] border border-[var(--border)] bg-[var(--surface2)]"
      style={{ color }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}
