'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';
import { sendNotification } from '@/lib/notifications';

// ─── Types ───────────────────────────────────────────────────────
interface Interpreter {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  initials: string;
  avatar_color: string;
  sign_languages?: string[];
  specializations?: string[];
  location?: string;
}

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  interpreter: Interpreter | null;
  userRole: 'deaf' | 'requester' | 'interpreter' | null;
  onSuccess?: (interpreterName: string) => void;
  /** Called when interpreter is already on the list (duplicate) */
  onDuplicate?: (interpreterName: string) => void;
  /** Edit mode: pass existing row ID to UPDATE instead of INSERT */
  editRowId?: string | null;
  /** Pre-populate tier in edit mode */
  editTier?: string | null;
  /** Pre-populate notes in edit mode */
  editNotes?: string | null;
  /** Called after successful delete in edit mode */
  onRemove?: (interpreterName: string) => void;
}

// ─── Role-specific config ────────────────────────────────────────
type TierConfig = {
  id: string;
  label: string;
  desc: string;
  accentVar: string;
};

type RoleConfig = {
  step1Label: string;
  tiers: TierConfig[];
  showApprovals: boolean;
  step2Label: string;
  step2Desc: string;
  workLabel: string;
  workDesc: string;
  personalLabel: string;
  personalDesc: string;
  noteLabel: string;
  notePlaceholder: string;
  confirmLabel: string;
  requireApproval: boolean;
  /** Label for the negative-list toggle (Do Not Book / Non-Recommended) */
  negativeListLabel: string;
  negativeListDesc: string;
};

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  deaf: {
    step1Label: 'Step 1 of 2: Which list should they go on?',
    tiers: [
      {
        id: 'preferred',
        label: '★ Preferred Interpreter',
        desc: 'Your first call. These are interpreters you trust and want contacted before anyone else. Requesters and medical providers will see this as your primary list.',
        accentVar: 'accent',
      },
      {
        id: 'secondary',
        label: '✓ Secondary Tier Interpreter',
        desc: "Good alternatives. Contacted if your Preferred list isn't available. Still part of your approved pool. Not a lesser endorsement, just a backup.",
        accentVar: 'accent2',
      },
    ],
    showApprovals: true,
    step2Label: 'Step 2 of 2: Approved for which settings?',
    step2Desc: 'Interpreter skills vary widely, and many Deaf people prefer different interpreters for different situations. This helps requesters and providers know who to call and when.',
    workLabel: '💼 Approved for work settings',
    workDesc: 'This interpreter will appear on your work list when you share it, visible to employers, HR teams, vocational rehab coordinators, and other professional requesters.',
    personalLabel: '🏥 Approved for personal and medical settings',
    personalDesc: 'This interpreter will appear on your personal/medical list when you share it, visible to doctors, hospitals, social services, and other non-work requesters.',
    noteLabel: 'Personal note (optional)',
    notePlaceholder: '"Best for medical — very clear signing, always confirms terminology with me beforehand."',
    confirmLabel: 'Add to my list →',
    requireApproval: true,
    negativeListLabel: '✕ Do Not Book',
    negativeListDesc: 'This interpreter will be flagged on your list so requesters know not to book them when you share your list.',
  },
  requester: {
    step1Label: 'Step 1 of 2: Which list should they go on?',
    tiers: [
      {
        id: 'preferred',
        label: '★ Preferred Interpreter',
        desc: 'Your first call for this client or context. When you send a request, Preferred interpreters are contacted before anyone else.',
        accentVar: 'accent',
      },
      {
        id: 'secondary',
        label: '✓ Secondary Tier Interpreter',
        desc: "Reliable alternatives. These interpreters are contacted when your Preferred list isn't available.",
        accentVar: 'accent2',
      },
    ],
    showApprovals: true,
    step2Label: 'Step 2 of 2: Approved for which assignment types?',
    step2Desc: "Some interpreters have narrower specializations. Marking which types of assignments they're right for helps you filter correctly when sending requests.",
    workLabel: '💼 Approved for professional / workplace assignments',
    workDesc: 'This interpreter can be assigned to employment-related work: workplace meetings, HR conversations, job training, professional conferences, and similar settings.',
    personalLabel: '🏥 Approved for medical and personal assignments',
    personalDesc: 'This interpreter can be assigned to personal-context work: medical appointments, hospital visits, social services, mental health sessions, and similar settings.',
    noteLabel: 'Note (optional)',
    notePlaceholder: '"Excellent for high-stakes medical settings. Always arrives early and reviews materials in advance."',
    confirmLabel: 'Add to my list →',
    requireApproval: true,
    negativeListLabel: '✕ Do Not Book',
    negativeListDesc: 'This interpreter will be flagged on your list so they are not booked.',
  },
  interpreter: {
    step1Label: 'Which tier should they be on?',
    tiers: [
      {
        id: 'preferred',
        label: '★ Top Tier Team Interpreter',
        desc: 'Interpreters you actively seek out for team assignments. When you need a partner for a job, these are your first calls.',
        accentVar: 'accent',
      },
      {
        id: 'secondary',
        label: '✓ Secondary Tier Team Interpreter',
        desc: "Colleagues you're open to teaming with. A good pool to draw from when your top tier interpreters aren't available.",
        accentVar: 'accent2',
      },
    ],
    showApprovals: false,
    step2Label: '',
    step2Desc: '',
    workLabel: '',
    workDesc: '',
    personalLabel: '',
    personalDesc: '',
    noteLabel: 'Note (optional)',
    notePlaceholder: '"Great partner for conference work — excellent at relay and pacing."',
    confirmLabel: 'Add to my team →',
    requireApproval: false,
    negativeListLabel: '✕ Not Recommended',
    negativeListDesc: 'This is for your personal reference only. The interpreter will not be notified.',
  },
  default: {
    step1Label: 'Step 1 of 2: Which list should they go on?',
    tiers: [
      {
        id: 'preferred',
        label: '★ Preferred Interpreter',
        desc: 'Your first call. These are interpreters you trust and want contacted before anyone else.',
        accentVar: 'accent',
      },
      {
        id: 'secondary',
        label: '✓ Secondary Tier Interpreter',
        desc: "Good alternatives when your Preferred list isn't available.",
        accentVar: 'accent2',
      },
    ],
    showApprovals: true,
    step2Label: 'Step 2 of 2: Approved for which settings?',
    step2Desc: 'You can approve an interpreter for one or both settings.',
    workLabel: '💼 Approved for work settings',
    workDesc: 'This interpreter will appear on your work list when you share it.',
    personalLabel: '🏥 Approved for personal and medical settings',
    personalDesc: 'This interpreter will appear on your personal/medical list when you share it.',
    noteLabel: 'Personal note (optional)',
    notePlaceholder: '"Best for medical — very clear signing."',
    confirmLabel: 'Add to my list →',
    requireApproval: true,
    negativeListLabel: '✕ Do Not Book',
    negativeListDesc: 'This interpreter will be flagged on your list so requesters know not to book them.',
  },
};

// ─── Component ───────────────────────────────────────────────────
export default function AddToListModal({
  isOpen,
  onClose,
  interpreter,
  userRole,
  onSuccess,
  onDuplicate,
  editRowId,
  editTier,
  editNotes,
  onRemove,
}: AddToListModalProps) {
  const isEditMode = !!editRowId;
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [approveWork, setApproveWork] = useState(false);
  const [approvePersonal, setApprovePersonal] = useState(false);
  const [note, setNote] = useState('');
  const [negativeList, setNegativeList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [removing, setRemoving] = useState(false);

  const focusTrapRef = useFocusTrap(isOpen);
  const supabase = createClient();
  const cfg = ROLE_CONFIGS[userRole || 'default'];

  useEffect(() => {
    if (isOpen) {
      setSelectedTier(isEditMode ? (editTier || null) : null);
      setApproveWork(false);
      setApprovePersonal(false);
      setNote(isEditMode ? (editNotes || '') : '');
      setNegativeList(false);
      setError(null);
      setSaving(false);
      setConfirmingRemove(false);
      setRemoving(false);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isEditMode, editTier, editNotes]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !interpreter) return null;

  // When negative list is active, tier and approvals are irrelevant
  const canConfirm = negativeList
    ? true
    : selectedTier !== null &&
      (!cfg.requireApproval || approveWork || approvePersonal);

  const handleConfirm = async () => {
    if (!canConfirm || saving) return;
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to add interpreters to your list.');
        setSaving(false);
        return;
      }

      if (userRole === 'interpreter') {
        if (isEditMode) {
          // Edit mode — UPDATE existing row
          const { error: updateErr } = await supabase
            .from('interpreter_preferred_team')
            .update({
              tier: negativeList ? 'non_recommended' : selectedTier,
              notes: note || null,
              non_recommended: negativeList,
            })
            .eq('id', editRowId);

          if (updateErr) {
            console.error('Update error (interpreter_preferred_team):', updateErr);
            setError(`Save failed: ${updateErr.message}`);
            setSaving(false);
            return;
          }
        } else {
          // Add mode — INSERT new row
          const { data: profile, error: profileErr } = await supabase
            .from('interpreter_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profileErr || !profile) {
            console.error('Profile lookup error:', profileErr);
            setError('Could not find your interpreter profile.');
            setSaving(false);
            return;
          }

          const { error: insertErr } = await supabase
            .from('interpreter_preferred_team')
            .insert({
              interpreter_id: profile.id,
              member_interpreter_id: interpreter.id,
              first_name: interpreter.first_name || interpreter.name.split(' ')[0],
              last_name: interpreter.last_name || interpreter.name.split(' ').slice(1).join(' '),
              email: '',
              status: 'accepted',
              tier: negativeList ? 'non_recommended' : selectedTier,
              notes: note || null,
              non_recommended: negativeList,
            });

          if (insertErr) {
            console.error('Insert error (interpreter_preferred_team):', insertErr);
            setError(`Save failed: ${insertErr.message}`);
            setSaving(false);
            return;
          }

          // Don't notify if non-recommended — that's private
          if (!negativeList) {
            // Notify the interpreter they were added to someone's preferred team
            const { data: memberProfile } = await supabase
              .from('interpreter_profiles')
              .select('user_id')
              .eq('id', interpreter.id)
              .single();

            if (memberProfile?.user_id) {
              // Get adder's name
              const { data: adderProfile } = await supabase
                .from('interpreter_profiles')
                .select('first_name, last_name')
                .eq('user_id', user.id)
                .single();
              const adderName = adderProfile
                ? `${adderProfile.first_name || ''} ${adderProfile.last_name || ''}`.trim()
                : '';

              sendNotification({
                recipientUserId: memberProfile.user_id,
                type: 'added_to_preferred_list_by_interpreter',
                subject: adderName
                  ? `You've been added to ${adderName}'s Preferred Team`
                  : "You've been added to a Preferred Team",
                body: adderName
                  ? `${adderName} has added you to their Preferred Team Interpreter list on signpost. This means they trust your work and want to team with you on future bookings. Thank you for being a trusted colleague.`
                  : "You've been added to a Preferred Team Interpreter list on signpost.",
                metadata: { adder_name: adderName || undefined },
                ctaText: 'View My Dashboard',
                ctaUrl: 'https://signpost.community/interpreter/dashboard',
              }).catch(err => console.error('[add-to-list] notification failed:', err));
            }
          }
        }
      } else {
        // Deaf / Requester / Default → deaf_roster
        const { error: insertErr } = await supabase.from('deaf_roster').insert({
          deaf_user_id: user.id,
          interpreter_id: interpreter.id,
          tier: negativeList ? 'dnb' : selectedTier,
          approve_work: negativeList ? false : approveWork,
          approve_personal: negativeList ? false : approvePersonal,
          notes: note || null,
          do_not_book: negativeList,
        });

        if (!insertErr) {
          // Don't notify if Do Not Book
          if (!negativeList) {
            // Notify the interpreter they were added to a preferred list
            const { data: interpProfile } = await supabase
              .from('interpreter_profiles')
              .select('user_id')
              .eq('id', interpreter.id)
              .single();

            if (interpProfile?.user_id) {
              // Determine notification type and adder name based on role
              let notifType: 'added_to_preferred_list_by_dhh' | 'added_to_preferred_list_by_org' | 'added_to_preferred_list' = 'added_to_preferred_list';
              let adderName = '';
              const notifMetadata: Record<string, unknown> = {};

              if (userRole === 'deaf') {
                notifType = 'added_to_preferred_list_by_dhh';
                const { data: deafProfile } = await supabase
                  .from('deaf_profiles')
                  .select('first_name, last_name')
                  .eq('user_id', user.id)
                  .maybeSingle();
                adderName = deafProfile
                  ? `${deafProfile.first_name || ''} ${deafProfile.last_name || ''}`.trim()
                  : '';
                notifMetadata.adder_name = adderName || undefined;
              } else if (userRole === 'requester') {
                notifType = 'added_to_preferred_list_by_org';
                const { data: reqProfile } = await supabase
                  .from('requester_profiles')
                  .select('first_name, last_name, organization_name')
                  .eq('user_id', user.id)
                  .maybeSingle();
                if (reqProfile?.organization_name) {
                  adderName = reqProfile.organization_name;
                  notifMetadata.organization_name = adderName;
                } else if (reqProfile) {
                  adderName = `${reqProfile.first_name || ''} ${reqProfile.last_name || ''}`.trim();
                  notifMetadata.adder_name = adderName || undefined;
                }
              }

              const fallbackSubject = adderName
                ? `You've been added to ${adderName}'s preferred interpreter list`
                : "You've been added to a preferred interpreter list";
              const fallbackBody = adderName
                ? `${adderName} has added you to their preferred interpreter list on signpost.`
                : "You've been added to a preferred interpreter list on signpost.";

              sendNotification({
                recipientUserId: interpProfile.user_id,
                type: notifType,
                subject: fallbackSubject,
                body: fallbackBody,
                metadata: notifMetadata,
                ctaText: 'View My Dashboard',
                ctaUrl: 'https://signpost.community/interpreter/dashboard',
              }).catch(err => console.error('[add-to-list] notification failed:', err));
            }
          }
        }

        if (insertErr) {
          console.error('Insert error (deaf_roster):', JSON.stringify(insertErr, null, 2));
          console.error('Attempted payload:', {
            deaf_user_id: user.id,
            interpreter_id: interpreter.id,
            tier: negativeList ? 'dnb' : selectedTier,
            approve_work: negativeList ? false : approveWork,
            approve_personal: negativeList ? false : approvePersonal,
            notes: note || null,
            do_not_book: negativeList,
          });

          if (insertErr.code === '23505') {
            // Duplicate — close modal and show toast instead of inline error
            if (onDuplicate) {
              onDuplicate(interpreter.name);
              onClose();
              return;
            }
            setError('This interpreter is already on your list.');
          } else if (insertErr.code === '42501') {
            setError('Permission denied. RLS policy may be missing for deaf_roster.');
          } else if (insertErr.code === '42703') {
            setError(
              `Column mismatch — deaf_roster schema needs updating. Error: ${insertErr.message}`
            );
          } else {
            setError(`Save failed: ${insertErr.message}`);
          }
          setSaving(false);
          return;
        }
      }

      onSuccess?.(interpreter.name);
      onClose();
    } catch (err) {
      console.error('Unexpected error in Add to List:', err);
      setError('An unexpected error occurred. Check the console.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!editRowId || !interpreter) return;
    setRemoving(true);
    setError(null);
    try {
      const { error: deleteErr } = await supabase
        .from('interpreter_preferred_team')
        .delete()
        .eq('id', editRowId);
      if (deleteErr) {
        setError(`Remove failed: ${deleteErr.message}`);
        setRemoving(false);
        return;
      }
      onRemove?.(interpreter.name);
      onClose();
    } catch (err) {
      console.error('Remove error:', err);
      setError('An unexpected error occurred.');
    } finally {
      setRemoving(false);
    }
  };

  const accentColor = (tier: TierConfig) =>
    tier.accentVar === 'accent'
      ? 'var(--accent, #00e5ff)'
      : 'var(--accent2, #9d87ff)';

  const accentBg = (tier: TierConfig) =>
    tier.accentVar === 'accent'
      ? 'rgba(0, 229, 255, 0.05)'
      : 'rgba(157, 135, 255, 0.05)';

  const isSelected = (tier: TierConfig) => selectedTier === tier.id;

  const subtitleParts = [
    interpreter.sign_languages?.join(', '),
    interpreter.specializations?.slice(0, 2).join(', '),
    interpreter.location,
  ].filter(Boolean);

  return (
    <div
      onClick={onClose}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(7, 9, 16, 0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? `Edit ${interpreter.name}` : `Add ${interpreter.name} to list`}
        onClick={(e) => e.stopPropagation()}
        className="modal-dialog"
        style={{
          background: 'var(--surface, #0f1118)',
          border: '1px solid var(--border, #1e2433)',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 40px 100px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 28px 20px',
            borderBottom: '1px solid var(--border, #1e2433)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background:
                interpreter.avatar_color ||
                'linear-gradient(135deg, #7b61ff, #00e5ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {interpreter.initials}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '3px',
              }}
            >
              {isEditMode ? `Edit — ${interpreter.name}` : interpreter.name}
            </div>
            <div
              style={{
                color: 'var(--muted, #b0b8d0)',
                fontSize: '0.82rem',
              }}
            >
              {subtitleParts.join(' · ')}
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Step 1: Tier selection — hidden when negative list is active */}
          {!negativeList && (
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted, #b0b8d0)',
                  marginBottom: '10px',
                }}
              >
                {cfg.step1Label}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {cfg.tiers.map((tier) => (
                  <div
                    key={tier.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTier(tier.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTier(tier.id); } }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '16px 18px',
                      borderRadius: '10px',
                      border: `2px solid ${
                        isSelected(tier)
                          ? accentColor(tier)
                          : 'var(--border, #1e2433)'
                      }`,
                      background: isSelected(tier)
                        ? accentBg(tier)
                        : 'var(--card-bg, #0d1220)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${
                          isSelected(tier)
                            ? accentColor(tier)
                            : 'var(--border, #1e2433)'
                        }`,
                        flexShrink: 0,
                        marginTop: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected(tier) && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: accentColor(tier),
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          marginBottom: '3px',
                        }}
                      >
                        {tier.label}
                      </div>
                      <div
                        style={{
                          color: 'var(--muted, #b0b8d0)',
                          fontSize: '0.78rem',
                          lineHeight: 1.55,
                        }}
                      >
                        {tier.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negative list toggle (Do Not Book / Not Recommended) */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: `1.5px solid ${
                negativeList
                  ? 'var(--accent3, #ff6b85)'
                  : 'var(--border, #1e2433)'
              }`,
              background: negativeList
                ? 'rgba(255, 107, 133, 0.06)'
                : 'var(--card-bg, #0d1220)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={negativeList}
              onChange={(e) => setNegativeList(e.target.checked)}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                width: '18px',
                height: '18px',
                borderRadius: '5px',
                flexShrink: 0,
                marginTop: '1px',
                border: `1.5px solid ${
                  negativeList
                    ? 'var(--accent3, #ff6b85)'
                    : 'var(--border, #1e2433)'
                }`,
                background: negativeList
                  ? 'var(--accent3, #ff6b85)'
                  : 'var(--surface, #0f1118)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.87rem',
                  marginBottom: '2px',
                  color: negativeList ? '#ff8099' : 'var(--text, #f0f2f8)',
                }}
              >
                {cfg.negativeListLabel}
              </div>
              <div
                style={{
                  color: 'var(--muted, #b0b8d0)',
                  fontSize: '0.77rem',
                  lineHeight: 1.5,
                }}
              >
                {cfg.negativeListDesc}
              </div>
            </div>
          </label>

          {/* Step 2: Approval settings (deaf + requester only) — hidden when negative list */}
          {cfg.showApprovals && !negativeList && (
            <div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--muted, #b0b8d0)',
                  marginBottom: '10px',
                }}
              >
                {cfg.step2Label}
              </div>
              <div
                style={{
                  color: 'var(--muted, #b0b8d0)',
                  fontSize: '0.81rem',
                  lineHeight: 1.6,
                  marginBottom: '12px',
                }}
              >
                {cfg.step2Desc}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Work approval */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${
                      approveWork
                        ? 'var(--accent, #00e5ff)'
                        : 'var(--border, #1e2433)'
                    }`,
                    background: approveWork
                      ? 'rgba(0, 229, 255, 0.04)'
                      : 'var(--card-bg, #0d1220)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={approveWork}
                    onChange={(e) => setApproveWork(e.target.checked)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      flexShrink: 0,
                      marginTop: '1px',
                      border: `1.5px solid ${
                        approveWork
                          ? 'var(--accent, #00e5ff)'
                          : 'var(--border, #1e2433)'
                      }`,
                      background: approveWork
                        ? 'var(--accent, #00e5ff)'
                        : 'var(--surface, #0f1118)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.87rem',
                        marginBottom: '2px',
                      }}
                    >
                      {cfg.workLabel}
                    </div>
                    <div
                      style={{
                        color: 'var(--muted, #b0b8d0)',
                        fontSize: '0.77rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {cfg.workDesc}
                    </div>
                  </div>
                </label>

                {/* Personal approval */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${
                      approvePersonal
                        ? 'var(--accent2, #9d87ff)'
                        : 'var(--border, #1e2433)'
                    }`,
                    background: approvePersonal
                      ? 'rgba(157, 135, 255, 0.04)'
                      : 'var(--card-bg, #0d1220)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={approvePersonal}
                    onChange={(e) => setApprovePersonal(e.target.checked)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      flexShrink: 0,
                      marginTop: '1px',
                      border: `1.5px solid ${
                        approvePersonal
                          ? 'var(--accent2, #9d87ff)'
                          : 'var(--border, #1e2433)'
                      }`,
                      background: approvePersonal
                        ? 'var(--accent2, #9d87ff)'
                        : 'var(--surface, #0f1118)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.87rem',
                        marginBottom: '2px',
                      }}
                    >
                      {cfg.personalLabel}
                    </div>
                    <div
                      style={{
                        color: 'var(--muted, #b0b8d0)',
                        fontSize: '0.77rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {cfg.personalDesc}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Note — always visible */}
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted, #b0b8d0)',
                marginBottom: '8px',
              }}
            >
              {cfg.noteLabel}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={cfg.notePlaceholder}
              style={{
                width: '100%',
                background: 'var(--card-bg, #0d1220)',
                border: '1px solid var(--border, #1e2433)',
                borderRadius: '10px',
                padding: '12px 14px',
                color: 'var(--text, #f0f2f8)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
                resize: 'vertical',
                minHeight: '72px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--accent, #00e5ff)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor =
                  'var(--border, #1e2433)')
              }
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: 'rgba(255, 107, 133, 0.08)',
                border: '1px solid rgba(255, 107, 133, 0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
                fontSize: '0.83rem',
                color: '#ff8099',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 28px',
            borderTop: '1px solid var(--border, #1e2433)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {isEditMode && (
            confirmingRemove ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
                <span style={{ fontSize: '0.82rem', color: '#ff8099' }}>Remove from team?</span>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  style={{
                    background: 'rgba(255, 107, 133, 0.12)',
                    border: '1px solid rgba(255, 107, 133, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: '#ff8099',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: removing ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    opacity: removing ? 0.5 : 1,
                  }}
                >
                  {removing ? 'Removing...' : 'Yes, remove'}
                </button>
                <button
                  onClick={() => setConfirmingRemove(false)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border, #1e2433)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    color: 'var(--muted, #b0b8d0)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingRemove(true)}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255, 107, 133, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  color: '#ff8099',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginRight: 'auto',
                }}
              >
                Remove from team
              </button>
            )
          )}
          {!isEditMode && <div style={{ marginRight: 'auto' }} />}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border, #1e2433)',
              borderRadius: '10px',
              padding: '10px 20px',
              color: 'var(--muted, #b0b8d0)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.87rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || saving}
            style={{
              background: negativeList ? 'var(--accent3, #ff6b85)' : 'var(--accent, #00e5ff)',
              color: negativeList ? '#fff' : '#000',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: '0.87rem',
              cursor: canConfirm && !saving ? 'pointer' : 'not-allowed',
              opacity: canConfirm && !saving ? 1 : 0.35,
              transition: 'opacity 0.15s',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {saving
              ? 'Saving...'
              : isEditMode
                ? 'Save changes'
                : negativeList
                  ? (userRole === 'interpreter' ? 'Mark as non-recommended' : 'Add to Do Not Book')
                  : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
