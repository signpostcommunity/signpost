'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { sendNotification } from '@/lib/notifications'

interface BatchInterpreter {
  id: string
  name: string
}

interface BatchAddToListModalProps {
  isOpen: boolean
  onClose: () => void
  interpreters: BatchInterpreter[]
  userRole: 'deaf' | 'requester' | 'interpreter' | null
  onSuccess?: (count: number, duplicateCount: number) => void
}

export default function BatchAddToListModal({
  isOpen,
  onClose,
  interpreters,
  userRole,
  onSuccess,
}: BatchAddToListModalProps) {
  const [selectedTier, setSelectedTier] = useState<'preferred' | 'secondary'>('preferred')
  const [approveWork, setApproveWork] = useState(true)
  const [approvePersonal, setApprovePersonal] = useState(true)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusTrapRef = useFocusTrap(isOpen)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      setSelectedTier('preferred')
      setApproveWork(true)
      setApprovePersonal(true)
      setNote('')
      setError(null)
      setSaving(false)
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen || interpreters.length === 0) return null

  const isDeaf = userRole === 'deaf'
  const isRequester = userRole === 'requester'
  const isInterpreter = userRole === 'interpreter'

  const tierLabel = selectedTier === 'preferred'
    ? (isInterpreter ? 'Top Tier Team' : 'Preferred')
    : 'Secondary Tier'

  const handleConfirm = async () => {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in.')
        setSaving(false)
        return
      }

      const interpreterIds = interpreters.map(i => i.id)
      let addedCount = 0
      let duplicateCount = 0

      if (isDeaf || (!isRequester && !isInterpreter)) {
        // Check for existing entries
        const { data: existing } = await supabase
          .from('deaf_roster')
          .select('interpreter_id')
          .eq('deaf_user_id', user.id)
          .in('interpreter_id', interpreterIds)

        const existingSet = new Set((existing || []).map(e => e.interpreter_id))
        const toInsert = interpreterIds.filter(id => !existingSet.has(id))
        duplicateCount = existingSet.size

        if (toInsert.length > 0) {
          const rows = toInsert.map(id => ({
            deaf_user_id: user.id,
            interpreter_id: id,
            tier: selectedTier === 'secondary' ? 'approved' : 'preferred',
            approve_work: approveWork,
            approve_personal: approvePersonal,
            notes: note || null,
            do_not_book: false,
          }))

          const { error: insertErr } = await supabase.from('deaf_roster').insert(rows)

          if (insertErr) {
            if (insertErr.code === '23503') {
              setError('One or more interpreters are no longer available.')
            } else {
              setError(`Save failed: ${insertErr.message}`)
            }
            setSaving(false)
            return
          }
          addedCount = toInsert.length

          // Fire-and-forget notifications
          for (const id of toInsert) {
            supabase
              .from('interpreter_profiles')
              .select('user_id')
              .eq('id', id)
              .single()
              .then(({ data: interpProfile }) => {
                if (interpProfile?.user_id) {
                  sendNotification({
                    recipientUserId: interpProfile.user_id,
                    type: 'added_to_preferred_list_by_dhh',
                    subject: 'You were added to a preferred interpreter list on signpost',
                    body: 'A Deaf/DB/HH user has added you to their preferred interpreter list. You may receive direct requests from them.',
                    metadata: {},
                    ctaText: 'View My Dashboard',
                    ctaUrl: 'https://signpost.community/interpreter/dashboard',
                  }).catch(err => console.error('[batch-add] notification failed:', err))
                }
              })
          }
        }
      } else if (isRequester) {
        // Check for existing entries
        const { data: existing } = await supabase
          .from('requester_roster')
          .select('interpreter_id')
          .eq('requester_user_id', user.id)
          .in('interpreter_id', interpreterIds)

        const existingSet = new Set((existing || []).map(e => e.interpreter_id))
        const toInsert = interpreterIds.filter(id => !existingSet.has(id))
        duplicateCount = existingSet.size

        if (toInsert.length > 0) {
          const rows = toInsert.map(id => ({
            requester_user_id: user.id,
            interpreter_id: id,
            tier: selectedTier,
            notes: note || null,
          }))

          const { error: insertErr } = await supabase.from('requester_roster').insert(rows)

          if (insertErr) {
            if (insertErr.code === '23503') {
              setError('One or more interpreters are no longer available.')
            } else {
              setError(`Save failed: ${insertErr.message}`)
            }
            setSaving(false)
            return
          }
          addedCount = toInsert.length

          // Fire-and-forget notifications
          for (const id of toInsert) {
            supabase
              .from('interpreter_profiles')
              .select('user_id')
              .eq('id', id)
              .single()
              .then(({ data: interpProfile }) => {
                if (interpProfile?.user_id) {
                  supabase
                    .from('requester_profiles')
                    .select('first_name, last_name, org_name')
                    .eq('user_id', user.id)
                    .maybeSingle()
                    .then(({ data: reqProfile }) => {
                      const adderName = reqProfile?.org_name
                        || (reqProfile ? `${reqProfile.first_name || ''} ${reqProfile.last_name || ''}`.trim() : '')

                      sendNotification({
                        recipientUserId: interpProfile.user_id,
                        type: 'added_to_preferred_list_by_org',
                        subject: adderName
                          ? `You've been added to ${adderName}'s preferred interpreter list`
                          : "You've been added to a preferred interpreter list",
                        body: adderName
                          ? `${adderName} has added you to their preferred interpreter list on signpost.`
                          : "You've been added to a preferred interpreter list on signpost.",
                        metadata: { adder_name: adderName || undefined },
                        ctaText: 'View My Dashboard',
                        ctaUrl: 'https://signpost.community/interpreter/dashboard',
                      }).catch(err => console.error('[batch-add] notification failed:', err))
                    })
                }
              })
          }
        }
      } else if (isInterpreter) {
        // Get interpreter's profile ID
        const { data: profile } = await supabase
          .from('interpreter_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!profile) {
          setError('Could not find your interpreter profile.')
          setSaving(false)
          return
        }

        // Check for existing entries
        const { data: existing } = await supabase
          .from('interpreter_preferred_team')
          .select('member_interpreter_id')
          .eq('interpreter_id', profile.id)
          .in('member_interpreter_id', interpreterIds)

        const existingSet = new Set((existing || []).map(e => e.member_interpreter_id))
        const toInsert = interpreterIds.filter(id => !existingSet.has(id))
        duplicateCount = existingSet.size

        if (toInsert.length > 0) {
          const rows = toInsert.map(id => {
            const interp = interpreters.find(x => x.id === id)
            const nameParts = (interp?.name || '').split(' ')
            return {
              interpreter_id: profile.id,
              member_interpreter_id: id,
              first_name: nameParts[0] || '',
              last_name: nameParts.slice(1).join(' ') || '',
              email: '',
              status: 'accepted',
              tier: selectedTier,
              notes: note || null,
              non_recommended: false,
            }
          })

          const { error: insertErr } = await supabase.from('interpreter_preferred_team').insert(rows)

          if (insertErr) {
            if (insertErr.code === '23503') {
              setError('One or more interpreters are no longer available.')
            } else {
              setError(`Save failed: ${insertErr.message}`)
            }
            setSaving(false)
            return
          }
          addedCount = toInsert.length

          // Fire-and-forget notifications
          const { data: adderProfile } = await supabase
            .from('interpreter_profiles')
            .select('first_name, last_name')
            .eq('user_id', user.id)
            .single()
          const adderName = adderProfile
            ? `${adderProfile.first_name || ''} ${adderProfile.last_name || ''}`.trim()
            : ''

          for (const id of toInsert) {
            supabase
              .from('interpreter_profiles')
              .select('user_id')
              .eq('id', id)
              .single()
              .then(({ data: interpProfile }) => {
                if (interpProfile?.user_id) {
                  sendNotification({
                    recipientUserId: interpProfile.user_id,
                    type: 'added_to_preferred_list_by_interpreter',
                    subject: adderName
                      ? `You've been added to ${adderName}'s Preferred Team`
                      : "You've been added to a Preferred Team",
                    body: adderName
                      ? `${adderName} has added you to their Preferred Team Interpreter list on signpost.`
                      : "You've been added to a Preferred Team Interpreter list on signpost.",
                    metadata: { adder_name: adderName || undefined },
                    ctaText: 'View My Dashboard',
                    ctaUrl: 'https://signpost.community/interpreter/dashboard',
                  }).catch(err => console.error('[batch-add] notification failed:', err))
                }
              })
          }
        }
      }

      onSuccess?.(addedCount, duplicateCount)
      onClose()
    } catch (err) {
      console.error('[batch-add] error:', err)
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(7,9,16,0.88)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${interpreters.length} interpreters to your list`}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
            fontSize: '1rem', color: 'var(--text)',
          }}>
            Add {interpreters.length} interpreter{interpreters.length !== 1 ? 's' : ''} to your list
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', fontSize: '1.2rem',
              cursor: 'pointer', padding: '4px 8px',
              borderRadius: 6, lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tier selection */}
          <div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10,
            }}>
              Tier
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'preferred' as const, label: isInterpreter ? 'Top Tier Team Interpreter' : 'Preferred' },
                { id: 'secondary' as const, label: 'Secondary Tier' },
              ].map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
                    background: selectedTier === tier.id ? 'rgba(0,229,255,0.08)' : 'transparent',
                    border: `1px solid ${selectedTier === tier.id ? 'rgba(0,229,255,0.3)' : 'var(--border)'}`,
                    borderRadius: 10, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.88rem', fontWeight: 600,
                    color: selectedTier === tier.id ? 'var(--accent)' : 'var(--muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${selectedTier === tier.id ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {selectedTier === tier.id && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                    )}
                  </span>
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Work/Personal approval (Deaf users only) */}
          {isDeaf && (
            <div>
              <div style={{
                fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--accent2)', marginBottom: 10,
              }}>
                Approved for
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { checked: approveWork, onChange: () => setApproveWork(!approveWork), label: 'Work settings' },
                  { checked: approvePersonal, onChange: () => setApprovePersonal(!approvePersonal), label: 'Personal and medical settings' },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onChange}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px',
                      background: 'transparent',
                      border: `1px solid ${item.checked ? 'rgba(167,139,250,0.3)' : 'var(--border)'}`,
                      borderRadius: 10, cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: '0.85rem', fontWeight: 500,
                      color: item.checked ? 'var(--text)' : 'var(--muted)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: `2px solid ${item.checked ? 'var(--accent2)' : 'var(--border)'}`,
                      background: item.checked ? 'var(--accent2)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {item.checked && (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M4 8l3 3 5-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional note */}
          <div>
            <label style={{
              display: 'block', fontSize: '0.82rem', fontWeight: 500,
              color: 'var(--muted)', marginBottom: 6,
            }}>
              Note (optional, applies to all)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note for all selected interpreters"
              rows={2}
              style={{
                width: '100%', background: 'var(--card-bg)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '11px 14px', color: 'var(--text)',
                fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Interpreter preview list */}
          <div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
            }}>
              Selected
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              maxHeight: 120, overflowY: 'auto',
            }}>
              {interpreters.map(i => (
                <span
                  key={i.id}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '4px 10px', borderRadius: 6,
                    background: 'var(--card-bg)', border: '1px solid var(--border)',
                    fontSize: '0.78rem', color: 'var(--text)', fontWeight: 500,
                  }}
                >
                  {i.name}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '0.82rem', color: 'var(--accent3)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px 20px',
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 10, fontSize: '0.88rem', fontWeight: 600,
                color: 'var(--muted)', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleConfirm}
              className="btn-primary"
              style={{
                flex: 1, padding: '12px 20px',
                fontSize: '0.88rem', fontWeight: 700,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Adding...' : `Add All to ${tierLabel}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
