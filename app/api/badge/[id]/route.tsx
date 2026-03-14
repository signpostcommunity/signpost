import { ImageResponse } from '@vercel/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Load Syne font weights from Google Fonts
async function loadFonts() {
  const [syne700, syne800] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_3fvj6k.ttf').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_24vj6k.ttf').then(r => r.arrayBuffer()),
  ])
  return [
    { name: 'Syne', data: syne700, weight: 700 as const, style: 'normal' as const },
    { name: 'Syne', data: syne800, weight: 800 as const, style: 'normal' as const },
  ]
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: profile, error } = await supabase
    .from('interpreter_profiles')
    .select('name, first_name, last_name, photo_url, sign_languages, draft_data')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return new Response('Not found', { status: 404 })
  }

  const displayName = profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Interpreter'

  // Extract certs from draft_data
  const draftData = (profile.draft_data || {}) as Record<string, unknown>
  const certs = Array.isArray(draftData.certifications)
    ? draftData.certifications
        .filter((c: Record<string, unknown>) => c && typeof c.name === 'string' && c.name.trim())
        .map((c: Record<string, unknown>) => c.name as string)
    : []

  // Build subtitle: sign language abbreviation + certs
  const langAbbrev = (profile.sign_languages || []).map((l: string) => {
    const match = l.match(/\(([^)]+)\)/)
    return match ? match[1] : l
  })
  const subtitleParts = [...langAbbrev.map((l: string) => `${l} interpreter`), ...certs]
  const subtitle = subtitleParts.join(' \u00B7 ') || 'Interpreter'

  // Fetch avatar as ArrayBuffer if available
  let avatarBuf: ArrayBuffer | null = null
  if (profile.photo_url) {
    try {
      const avatarRes = await fetch(profile.photo_url)
      if (avatarRes.ok) {
        avatarBuf = await avatarRes.arrayBuffer()
      }
    } catch {
      // Fallback to initials if fetch fails
    }
  }

  const fonts = await loadFonts()

  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '500px',
          height: '130px',
          background: '#0a0a0f',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            position: 'absolute',
            left: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '94px',
            height: '94px',
            borderRadius: '50%',
            border: '2px solid #00e5ff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #7b61ff, #00e5ff)',
          }}
        >
          {avatarBuf ? (
            <img
              src={`data:image/jpeg;base64,${Buffer.from(avatarBuf).toString('base64')}`}
              width={94}
              height={94}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span style={{ color: '#fff', fontSize: '28px', fontFamily: 'Syne', fontWeight: 700 }}>
              {initials}
            </span>
          )}
        </div>

        {/* Text block */}
        <div
          style={{
            position: 'absolute',
            left: '130px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Name */}
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '22px', color: '#f0f2f8' }}>
            {displayName}
          </div>

          {/* Certs line */}
          <div style={{ fontSize: '14px', color: '#b0b8d0' }}>
            {subtitle}
          </div>

          {/* Book me on signpost line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', marginTop: '2px' }}>
            <div
              style={{
                width: '2.5px',
                height: '18px',
                background: '#00e5ff',
                borderRadius: '2px',
                marginRight: '8px',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '16px', color: '#b0b8d0' }}>Book me on</span>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '18px', color: '#ffffff', marginLeft: '6px' }}>
              sign
            </span>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '18px', color: '#00e5ff' }}>
              post
            </span>
            <span style={{ color: '#00e5ff', fontSize: '18px', marginLeft: '4px', fontWeight: 700 }}>
              ›
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 500,
      height: 130,
      fonts,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    }
  )

  return response
}
