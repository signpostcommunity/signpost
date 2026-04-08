'use client'

/**
 * Shared BookMe badge preview - renders the server-generated PNG badge image.
 * Used on both the interpreter dashboard home and profile/edit pages.
 */
export default function BookMeBadge({
  interpreterProfileId,
  displayName,
}: {
  interpreterProfileId: string
  displayName: string
}) {
  return (
    <div style={{
      background: '#1a1a24', padding: '24px 32px',
      display: 'flex', justifyContent: 'center',
      maxWidth: 540,
    }}>
      <img
        src={`/api/badge/${interpreterProfileId}`}
        alt={`Book ${displayName} on signpost`}
        width={500}
        style={{ borderRadius: '16px', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
