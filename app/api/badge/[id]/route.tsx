import { createClient } from '@supabase/supabase-js'
import { initWasm, Resvg } from '@resvg/resvg-wasm'
import { readFile } from 'fs/promises'
import { join } from 'path'

let wasmInitialized = false

const fontCache: { syne700?: ArrayBuffer; syne800?: ArrayBuffer; inter400?: ArrayBuffer } = {}

async function loadFonts() {
  if (!fontCache.syne700) {
    const [syne700, syne800, inter400] = await Promise.all([
      fetch('https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_3fvj6k.ttf').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/syne/v24/8vIS7w4qzmVxsWxjBZRjr0FKM_24vj6k.ttf').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf').then(r => r.arrayBuffer()),
    ])
    fontCache.syne700 = syne700
    fontCache.syne800 = syne800
    fontCache.inter400 = inter400
  }
  return fontCache as Required<typeof fontCache>
}

async function ensureWasm() {
  if (wasmInitialized) return
  const wasmPath = join(process.cwd(), 'node_modules/@resvg/resvg-wasm/index_bg.wasm')
  const wasmBuffer = await readFile(wasmPath)
  await initWasm(wasmBuffer)
  wasmInitialized = true
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    await ensureWasm()

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

    const displayName =
      profile.name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      'Interpreter'

    // Extract certs from draft_data
    const draftData = (profile.draft_data || {}) as Record<string, unknown>
    const certs = Array.isArray(draftData.certifications)
      ? draftData.certifications
          .filter(
            (c: Record<string, unknown>) =>
              c && typeof c.name === 'string' && c.name.trim()
          )
          .map((c: Record<string, unknown>) => c.name as string)
      : []

    // Build subtitle: sign language abbreviation + certs
    const langAbbrev = (profile.sign_languages || []).map((l: string) => {
      const match = l.match(/\(([^)]+)\)/)
      return match ? match[1] : l
    })
    const subtitleParts = [
      ...langAbbrev.map((l: string) => `${l} interpreter`),
      ...certs,
    ]
    const subtitle = subtitleParts.join(' \u00B7 ') || 'Interpreter'

    // Fetch avatar and convert to base64 data URI
    let avatarDataUri = ''
    if (profile.photo_url) {
      try {
        const avatarRes = await fetch(profile.photo_url)
        if (avatarRes.ok) {
          const buf = await avatarRes.arrayBuffer()
          const base64 = Buffer.from(buf).toString('base64')
          const contentType = avatarRes.headers.get('content-type') || 'image/jpeg'
          avatarDataUri = `data:${contentType};base64,${base64}`
        }
      } catch {
        // Fallback to initials
      }
    }

    const initials = displayName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    // Escape XML special characters
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    // Build avatar SVG fragment
    const avatarFragment = avatarDataUri
      ? `<defs>
          <clipPath id="avatar-clip">
            <circle cx="65" cy="65" r="47" />
          </clipPath>
        </defs>
        <image href="${avatarDataUri}" x="18" y="18" width="94" height="94" clip-path="url(#avatar-clip)" preserveAspectRatio="xMidYMid slice" />
        <circle cx="65" cy="65" r="47" fill="none" stroke="#00e5ff" stroke-width="2" />`
      : `<defs>
          <linearGradient id="avatar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7b61ff" />
            <stop offset="100%" stop-color="#00e5ff" />
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r="47" fill="url(#avatar-grad)" />
        <circle cx="65" cy="65" r="47" fill="none" stroke="#00e5ff" stroke-width="2" />
        <text x="65" y="65" text-anchor="middle" dominant-baseline="central" font-family="'Syne'" font-weight="700" font-size="28" fill="#ffffff">${esc(initials)}</text>`

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="130" viewBox="0 0 500 130">
      <rect width="500" height="130" rx="16" fill="#0a0a0f" />
      ${avatarFragment}
      <text x="130" y="42" font-family="'Syne'" font-weight="700" font-size="22" fill="#f0f2f8">${esc(displayName)}</text>
      <text x="130" y="62" font-family="'Inter'" font-weight="400" font-size="14" fill="#b0b8d0">${esc(subtitle)}</text>
      <rect x="130" y="80" width="2.5" height="18" rx="1" fill="#00e5ff" />
      <text x="138" y="95" font-family="'Inter'" font-weight="400" font-size="16" fill="#b0b8d0">Book me on</text>
      <text x="238" y="95" font-family="'Syne'" font-weight="800" font-size="18" fill="#ffffff">sign</text>
      <text x="274" y="95" font-family="'Syne'" font-weight="800" font-size="18" fill="#00e5ff">post</text>
      <text x="312" y="95" font-size="20" fill="#00e5ff">\u203A</text>
    </svg>`

    const fonts = await loadFonts()

    const resvg = new Resvg(svgString, {
      fitTo: { mode: 'width', value: 1000 },
      font: {
        fontBuffers: [
          new Uint8Array(fonts.syne700),
          new Uint8Array(fonts.syne800),
          new Uint8Array(fonts.inter400),
        ],
        loadSystemFonts: false,
      },
    })
    const pngData = resvg.render()
    const pngBuffer = pngData.asPng()

    return new Response(Buffer.from(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (err: unknown) {
    const e = err as Error
    return new Response(
      JSON.stringify({
        error: e.message,
        stack: e.stack,
        name: e.name,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
