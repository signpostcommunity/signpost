'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Loading contacts...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('Access denied. You can close this window.')
      if (window.opener) {
        window.opener.postMessage({ type: 'google-contacts-error', error }, '*')
      }
      return
    }

    if (!code) {
      setStatus('No authorization code received.')
      return
    }

    // Fetch contacts using the code
    fetch(`/api/google-contacts?action=fetch&code=${encodeURIComponent(code)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus(`Error: ${data.error}`)
          if (window.opener) {
            window.opener.postMessage({ type: 'google-contacts-error', error: data.error }, '*')
          }
          return
        }

        // Send contacts back to opener
        if (window.opener) {
          window.opener.postMessage({
            type: 'google-contacts-success',
            contacts: data.contacts,
          }, '*')
          setStatus('Contacts loaded. This window will close automatically.')
          setTimeout(() => window.close(), 1000)
        } else {
          setStatus('Contacts loaded, but could not communicate with the main window. Please close this window and try again.')
        }
      })
      .catch(err => {
        console.error('Callback error:', err)
        setStatus('Failed to load contacts. Please try again.')
        if (window.opener) {
          window.opener.postMessage({ type: 'google-contacts-error', error: 'fetch_failed' }, '*')
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      background: '#0a0a0f',
      color: '#f0f2f8',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      fontSize: '15px',
      padding: 24,
    }}>
      <div style={{
        background: '#111118',
        border: '1px solid #1e2433',
        borderRadius: 16,
        padding: '32px 40px',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        <p style={{ margin: 0, color: '#c8cdd8' }}>{status}</p>
      </div>
    </div>
  )
}

export default function GoogleContactsCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: '#0a0a0f',
        color: '#c8cdd8',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        Loading...
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
