import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { city, state, country } = await req.json()

  // Build query string from available location parts
  const parts = [city, state, country].filter(Boolean)
  if (parts.length === 0) {
    return NextResponse.json({ error: 'No location provided' }, { status: 400 })
  }
  const query = parts.join(', ')

  const apiKey = process.env.OPENCAGE_API_KEY
  if (!apiKey) {
    console.error('[geocode] OPENCAGE_API_KEY not set')
    return NextResponse.json({ error: 'Geocoding not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=1&no_annotations=1`
    )
    const data = await res.json()

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry
      return NextResponse.json({ latitude: lat, longitude: lng })
    }

    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  } catch (err) {
    console.error('[geocode] Failed:', err)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
