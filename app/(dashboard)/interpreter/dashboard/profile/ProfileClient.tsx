'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/dashboard/interpreter/shared'
import Toast from '@/components/ui/Toast'
import { ALL_SIGN_LANGS, ALL_SPOKEN_LANGS, ALL_SPECS, ALL_REGIONS } from '@/lib/data/seed'

// ── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  color: 'var(--muted)',
  marginBottom: 6,
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--accent)',
  margin: '32px 0 16px',
}

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: '0.82rem',
    cursor: 'pointer',
    border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
    background: selected ? 'rgba(0,229,255,0.1)' : 'transparent',
    color: selected ? 'var(--accent)' : 'var(--muted)',
    fontWeight: selected ? 600 : 400,
    transition: 'all 0.15s',
    fontFamily: "'DM Sans', sans-serif",
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  first_name?: string | null
  last_name?: string | null
  city?: string | null
  country?: string | null
  bio?: string | null
  mode_of_work?: string | null
  sign_languages?: string[] | null
  spoken_languages?: string[] | null
  specializations?: string[] | null
  regions?: string[] | null
  video_url?: string | null
  video_description?: string | null
  status?: string | null
}

interface ProfileClientProps {
  profile: Record<string, unknown> | null
  userEmail: string
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfileClient({ profile: rawProfile, userEmail }: ProfileClientProps) {
  const p = (rawProfile || {}) as ProfileData
  const hasProfile = !!rawProfile

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState(p.first_name || '')
  const [lastName, setLastName] = useState(p.last_name || '')
  const [city, setCity] = useState(p.city || '')
  const [country, setCountry] = useState(p.country || '')
  const [modeOfWork, setModeOfWork] = useState(p.mode_of_work || '')
  const [signLangs, setSignLangs] = useState<string[]>(p.sign_languages || [])
  const [spokenLangs, setSpokenLangs] = useState<string[]>(p.spoken_languages || [])
  const [specs, setSpecs] = useState<string[]>(p.specializations || [])
  const [regions, setRegions] = useState<string[]>(p.regions || [])
  const [bio, setBio] = useState(p.bio || '')
  const [videoUrl, setVideoUrl] = useState(p.video_url || '')

  function toggleInList(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase
      .from('interpreter_profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        city,
        country,
        mode_of_work: modeOfWork,
        sign_languages: signLangs,
        spoken_languages: spokenLangs,
        specializations: specs,
        regions,
        bio,
        video_url: videoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    setSaving(false)
    if (error) {
      setToast('Error saving profile. Please try again.')
    } else {
      setToast('Profile saved successfully.')
      setEditing(false)
    }
  }

  const displayName = hasProfile
    ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || userEmail
    : userEmail
  const initials = hasProfile && p.first_name
    ? `${p.first_name[0]}${p.last_name?.[0] || ''}`.toUpperCase()
    : userEmail[0]?.toUpperCase() || '?'

  // ── Read-only view ───────────────────────────────────────────────────────

  if (!editing) {
    return (
      <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 720 }}>
        <PageHeader
          title="My Profile"
          subtitle={hasProfile
            ? "This is what requesters see when they view your listing. Keep it current — your profile is your first impression."
            : "You haven't completed your profile yet. Click Edit Profile to get started."
          }
        />

        {/* Profile summary card */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7b61ff,#00e5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#fff',
            }}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem' }}>{displayName}</div>
              {p.status && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    background: p.status === 'approved' ? 'rgba(0,229,255,0.1)' : 'rgba(255,165,0,0.12)',
                    border: p.status === 'approved' ? '1px solid rgba(0,229,255,0.25)' : '1px solid rgba(255,165,0,0.3)',
                    color: p.status === 'approved' ? 'var(--accent)' : '#f97316',
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    {p.status === 'approved' ? '✓ Approved' : p.status === 'pending' ? '⏳ Pending Review' : p.status}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--muted)', fontSize: '0.82rem', padding: '8px 16px',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Edit Profile
            </button>
          </div>

          <InfoRow label="Location" value={[p.city, p.country].filter(Boolean).join(', ') || 'Not set yet'} />
          <InfoRow label="Sign Languages" value={p.sign_languages?.join(', ') || 'Not set yet'} />
          <InfoRow label="Spoken Languages" value={p.spoken_languages?.join(', ') || 'Not set yet'} />
          <InfoRow label="Specializations" value={p.specializations?.join(', ') || 'Not set yet'} />
          <InfoRow label="Mode" value={p.mode_of_work || 'Not set yet'} />
          <InfoRow label="Service Area" value={p.regions?.join(', ') || 'Not set yet'} />
        </div>

        {/* Bio */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Bio</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
            {p.bio || 'No bio set yet. Click Edit Profile to add one.'}
          </p>
        </div>

        {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      </div>
    )
  }

  // ── Edit form ────────────────────────────────────────────────────────────

  return (
    <div className="dash-page-content" style={{ padding: '48px 56px', maxWidth: 720 }}>
      <PageHeader
        title="Edit Profile"
        subtitle="Update your information below. Changes are saved when you click Save."
      />

      {/* BASIC INFO */}
      <div style={sectionTitleStyle}>Basic Info</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>First Name</label>
          <input
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Last Name</label>
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>City</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div>
          <label style={labelStyle}>State / Country</label>
          <input
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Mode of Work</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['On-site', 'Remote', 'Both'].map(mode => (
            <button
              key={mode}
              onClick={() => setModeOfWork(mode)}
              style={chipStyle(modeOfWork === mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* LANGUAGES & SPECIALIZATIONS */}
      <div style={sectionTitleStyle}>Languages &amp; Specializations</div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sign Languages</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_SIGN_LANGS.map(lang => (
            <button key={lang} onClick={() => toggleInList(signLangs, lang, setSignLangs)} style={chipStyle(signLangs.includes(lang))}>
              {lang}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Spoken Languages</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_SPOKEN_LANGS.map(lang => (
            <button key={lang} onClick={() => toggleInList(spokenLangs, lang, setSpokenLangs)} style={chipStyle(spokenLangs.includes(lang))}>
              {lang}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Specializations</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_SPECS.map(spec => (
            <button key={spec} onClick={() => toggleInList(specs, spec, setSpecs)} style={chipStyle(specs.includes(spec))}>
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICE AREA */}
      <div style={sectionTitleStyle}>Service Area</div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Regions</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ALL_REGIONS.map(region => (
            <button key={region} onClick={() => toggleInList(regions, region, setRegions)} style={chipStyle(regions.includes(region))}>
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* BIO & VIDEO */}
      <div style={sectionTitleStyle}>Bio &amp; Video</div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Professional Bio</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Video URL</label>
        <input
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/..."
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--muted)', fontSize: '0.88rem', padding: '10px 20px',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
      </div>

      {toast && <Toast message={toast} type={toast.startsWith('Error') ? 'error' : 'success'} onClose={() => setToast(null)} />}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ color: value === 'Not set yet' ? 'var(--muted)' : 'var(--text)', textAlign: 'right', maxWidth: '60%', fontStyle: value === 'Not set yet' ? 'italic' : 'normal' }}>{value}</span>
    </div>
  )
}
