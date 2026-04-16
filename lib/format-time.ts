/**
 * Format a past ISO timestamp as a short relative time.
 * Examples: "Just now", "15m ago", "3h ago", "Yesterday", "4d ago", "Apr 8"
 */
export function formatContactedAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then

  if (diffMs < 60 * 1000) return 'Just now'
  if (diffMs < 60 * 60 * 1000) {
    const mins = Math.floor(diffMs / (60 * 1000))
    return `${mins}m ago`
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    const hrs = Math.floor(diffMs / (60 * 60 * 1000))
    return `${hrs}h ago`
  }
  if (diffMs < 2 * 24 * 60 * 60 * 1000) return 'Yesterday'
  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    return `${days}d ago`
  }
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
