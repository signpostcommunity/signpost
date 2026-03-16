'use client'

import Link from 'next/link'

interface CommPrefs {
  signing_style?: string
  preferred_domains?: string[]
  cdi_preferred?: boolean
  team_interpreting?: string
  notes?: string
}

export default function CommPrefsDisplay({
  commPrefs,
  editable = false,
  onEditClick,
}: {
  commPrefs: CommPrefs | null | undefined
  editable?: boolean
  onEditClick?: () => void
}) {
  const hasAny = commPrefs && (
    commPrefs.signing_style ||
    (commPrefs.preferred_domains && commPrefs.preferred_domains.length > 0) ||
    commPrefs.cdi_preferred ||
    commPrefs.team_interpreting ||
    commPrefs.notes
  )

  const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4,
  }
  const valueStyle: React.CSSProperties = {
    fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.55, marginBottom: 14,
  }

  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '20px 24px',
    }}>
      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '0.92rem',
        marginBottom: hasAny ? 16 : 8,
      }}>
        Communication Preferences
      </div>

      {!hasAny ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
          No communication preferences set.
          {editable && (
            <>
              {' '}Adding them helps interpreters prepare for your appointment.{' '}
              {onEditClick ? (
                <button
                  onClick={onEditClick}
                  style={{
                    background: 'none', border: 'none', color: '#9d87ff',
                    cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem',
                    padding: 0, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Set your preferences
                </button>
              ) : (
                <Link href="/dhh/dashboard/preferences" style={{ color: '#9d87ff', textDecoration: 'underline' }}>
                  Set your preferences
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {commPrefs?.signing_style && (
            <>
              <div style={labelStyle}>Signing Style</div>
              <div style={valueStyle}>{commPrefs.signing_style}</div>
            </>
          )}

          {commPrefs?.preferred_domains && commPrefs.preferred_domains.length > 0 && (
            <>
              <div style={labelStyle}>Preferred Domains</div>
              <div style={valueStyle}>{commPrefs.preferred_domains.join(', ')}</div>
            </>
          )}

          {commPrefs?.cdi_preferred && (
            <>
              <div style={labelStyle}>CDI Preference</div>
              <div style={valueStyle}>Prefers a Certified Deaf Interpreter (CDI)</div>
            </>
          )}

          {commPrefs?.team_interpreting && (
            <>
              <div style={labelStyle}>Team Interpreting</div>
              <div style={valueStyle}>{commPrefs.team_interpreting}</div>
            </>
          )}

          {commPrefs?.notes && (
            <>
              <div style={labelStyle}>Additional Notes</div>
              <div style={valueStyle}>{commPrefs.notes}</div>
            </>
          )}

          {editable && (
            <div style={{ marginTop: 4 }}>
              {onEditClick ? (
                <button
                  onClick={onEditClick}
                  style={{
                    background: 'none', border: 'none', color: '#9d87ff',
                    cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem',
                    padding: 0, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Edit preferences
                </button>
              ) : (
                <Link href="/dhh/dashboard/preferences" style={{ color: '#9d87ff', textDecoration: 'underline', fontSize: '0.82rem' }}>
                  Edit preferences
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
