import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.NODE_ENV === 'production'
  ? 'https://signpost.community/api/google-contacts/callback'
  : 'http://localhost:3000/api/google-contacts/callback'

// GET /api/google-contacts?action=auth-url - returns OAuth URL
// GET /api/google-contacts?action=fetch&code=... - exchanges code for contacts
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action')

  if (action === 'auth-url') {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/contacts.readonly',
      access_type: 'offline',
      prompt: 'consent',
    })

    return NextResponse.json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    })
  }

  if (action === 'fetch') {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 })
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenRes.json()
      if (!tokenData.access_token) {
        console.error('[google-contacts] Token exchange failed:', tokenData)
        return NextResponse.json({ error: 'Failed to get access token' }, { status: 400 })
      }

      // Fetch contacts from People API
      const contactsRes = await fetch(
        'https://people.googleapis.com/v1/people/me/connections' +
        '?personFields=names,emailAddresses,phoneNumbers' +
        '&pageSize=1000' +
        '&sortOrder=FIRST_NAME_ASCENDING',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      )

      const contactsData = await contactsRes.json()
      const connections = contactsData.connections || []

      // Map to simple format
      const contacts = connections
        .map((person: {
          names?: Array<{ displayName?: string; givenName?: string; familyName?: string }>
          emailAddresses?: Array<{ value?: string }>
          phoneNumbers?: Array<{ canonicalForm?: string; value?: string }>
        }) => {
          const name = person.names?.[0]
          const email = person.emailAddresses?.[0]?.value || null
          const phone = person.phoneNumbers?.[0]?.canonicalForm || person.phoneNumbers?.[0]?.value || null

          return {
            name: name?.displayName || [name?.givenName, name?.familyName].filter(Boolean).join(' ') || null,
            firstName: name?.givenName || null,
            lastName: name?.familyName || null,
            email,
            phone,
          }
        })
        .filter((c: { name: string | null }) => c.name)

      return NextResponse.json({ contacts })
    } catch (err) {
      console.error('[google-contacts] Error:', err)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
