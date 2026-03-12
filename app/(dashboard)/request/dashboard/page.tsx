'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type RequestStatus = 'pending' | 'confirmed' | 'completed' | 'declined';

interface Request {
  id: string;
  interpreter: string;
  type: string;
  date: string;
  status: RequestStatus;
  format: string;
}

const INITIAL_REQUESTS: Request[] = [
  { id: '1', interpreter: 'Sofia Reyes', type: 'Medical', date: '2026-03-10', status: 'pending', format: 'In-person' },
  { id: '2', interpreter: 'Léa Martin', type: 'Conference', date: '2026-03-15', status: 'pending', format: 'Remote' },
  { id: '3', interpreter: 'James Thornton', type: 'Legal', date: '2026-02-20', status: 'confirmed', format: 'In-person' },
  { id: '4', interpreter: 'Amara Wilson', type: 'Academic', date: '2026-02-10', status: 'completed', format: 'Remote' },
];

const STATUS_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  pending:   { bg: 'rgba(255,165,0,0.12)', border: 'rgba(249,115,22,0.3)', color: '#f97316' },
  confirmed: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
  completed: { bg: 'rgba(157,135,255,0.1)', border: 'rgba(157,135,255,0.3)', color: 'var(--accent2)' },
  declined:  { bg: 'rgba(255,107,133,0.1)', border: 'rgba(255,107,133,0.3)', color: 'var(--accent3)' },
};

const TABS: Array<'all' | RequestStatus> = ['all', 'pending', 'confirmed', 'completed', 'declined'];
const EVENT_TYPES = ['Medical', 'Legal', 'Conference', 'Academic', 'Business', 'Community', 'Religious', 'Other'];
const FORMATS = ['In-person', 'Remote', 'Hybrid'];

const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const modalBoxStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', width: '100%', maxWidth: 520,
  maxHeight: '85vh', overflowY: 'auto', padding: 28, position: 'relative',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 6, fontWeight: 600,
};

/* ── Detail Modal ── */
function DetailModal({ request, onClose, onCancel }: {
  request: Request; onClose: () => void; onCancel: (id: string) => void;
}) {
  const ss = STATUS_STYLES[request.status];
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  return (
    <div role="presentation" style={backdropStyle} onClick={onClose}>
      <div style={modalBoxStyle} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

        <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.25rem', marginBottom: 20 }}>Request Details</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1rem', color: '#000',
          }}>{request.interpreter.split(' ').map(n => n[0]).join('')}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.05rem' }}>{request.interpreter}</div>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: ss.bg, border: `1px solid ${ss.border}`,
              borderRadius: 100, padding: '2px 10px', fontSize: '0.72rem',
              color: ss.color, fontWeight: 600, textTransform: 'capitalize',
            }}>{request.status}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Request Type</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{request.type}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Date</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{request.date}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Format</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>{request.format}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, textTransform: 'capitalize' }}>{request.status}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {request.status === 'pending' && !showCancelConfirm && (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              padding: '9px 18px', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer',
              background: 'rgba(255,107,133,0.1)', border: '1px solid rgba(255,107,133,0.3)',
              color: 'var(--accent3)', fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}>Cancel Request</button>
          )}
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer',
            background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
            fontFamily: "'DM Sans', sans-serif",
          }}>Close</button>
        </div>

        {showCancelConfirm && (
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: 'rgba(255,107,133,0.06)', border: '1px solid rgba(255,107,133,0.2)' }}>
            <p style={{ fontSize: '0.88rem', marginBottom: 12, color: 'var(--text)' }}>
              Are you sure you want to cancel this request? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{
                padding: '8px 16px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer',
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}>Keep Request</button>
              <button onClick={() => { onCancel(request.id); onClose(); }} style={{
                padding: '8px 16px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer',
                background: 'var(--accent3)', border: 'none', color: '#fff', fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
              }}>Yes, Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── New Request Modal ── */
function NewRequestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [format, setFormat] = useState('');
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [languages, setLanguages] = useState('');
  const totalSteps = 3;

  const canNext = () => {
    if (step === 1) return eventType && date && time && format;
    return true;
  };

  return (
    <div role="presentation" style={backdropStyle} onClick={onClose}>
      <div style={{ ...modalBoxStyle, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>

        <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.25rem', marginBottom: 4 }}>New Interpreter Request</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 20 }}>Step {step} of {totalSteps}</p>

        {/* Progress bar */}
        <div style={{ height: 4, borderRadius: 2, background: 'var(--surface2)', marginBottom: 24 }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${(step / totalSteps) * 100}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.3s ease' }} />
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Event Type *</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)} style={inputStyle}>
                <option value="">Select event type...</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Time *</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Format *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setFormat(f)} style={{
                    flex: 1, padding: 10, borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                    background: format === f ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    border: format === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                    color: format === f ? 'var(--accent)' : 'var(--muted)',
                  }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input type="text" placeholder="Enter address or venue name" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Additional Details</label>
              <textarea placeholder="Provide any additional context, requirements, or special instructions..." value={details} onChange={e => setDetails(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Language Preferences</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>Specify any sign language or spoken language requirements.</p>
              <textarea placeholder="e.g., ASL preferred, Spanish spoken language support needed..." value={languages} onChange={e => setLanguages(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              After submitting, matching interpreters will be notified and you will receive responses in your dashboard.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 10 }}>
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={{
                padding: '9px 18px', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer',
                background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)',
                fontFamily: "'DM Sans', sans-serif",
              }}>Back</button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} className="btn-primary" style={{
                padding: '9px 22px', fontSize: '0.85rem', opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed',
              }}>Next</button>
            ) : (
              <button onClick={onSubmit} className="btn-primary" style={{ padding: '9px 22px', fontSize: '0.85rem' }}>Submit Request</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 2000,
      background: 'var(--card-bg)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 'var(--radius)',
      padding: '12px 24px', fontSize: '0.88rem', color: '#34d399',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>{message}</div>
  );
}

/* ── Main Page ── */
export default function RequesterDashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | RequestStatus>('all');
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [detailRequest, setDetailRequest] = useState<Request | null>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  const handleCancelRequest = useCallback((id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' as RequestStatus } : r));
    showToast('Request cancelled successfully');
  }, [showToast]);

  const handleNewRequestSubmit = useCallback(() => {
    setShowNewRequest(false);
    showToast('Request submitted successfully');
  }, [showToast]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 32px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>My Requests</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Track and manage your interpreter requests</p>
        </div>
        <button onClick={() => setShowNewRequest(true)} className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.88rem', cursor: 'pointer' }}>
          + New Request
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 16px', borderRadius: 7,
            background: activeTab === t ? 'var(--surface2)' : 'none',
            border: activeTab === t ? '1px solid var(--border)' : '1px solid transparent',
            color: activeTab === t ? 'var(--text)' : 'var(--muted)',
            fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize',
            fontFamily: "'DM Sans', sans-serif",
          }}>{t}</button>
        ))}
      </div>

      {/* Requests */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(req => {
          const ss = STATUS_STYLES[req.status];
          return (
            <div key={req.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700 }}>{req.interpreter}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 100, padding: '2px 10px', fontSize: '0.72rem', color: ss.color, fontWeight: 600, textTransform: 'capitalize' }}>{req.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>{req.type}</span>
                  <span>📅 {req.date}</span>
                  <span>💻 {req.format}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setDetailRequest(req)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>View</button>
                <button onClick={() => showToast(`Messaging ${req.interpreter}...`)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 14px', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Message</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, marginBottom: 8 }}>No requests found</div>
          <Link href="/directory" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>Browse interpreters →</Link>
        </div>
      )}

      {detailRequest && <DetailModal request={detailRequest} onClose={() => setDetailRequest(null)} onCancel={handleCancelRequest} />}
      {showNewRequest && <NewRequestModal onClose={() => setShowNewRequest(false)} onSubmit={handleNewRequestSubmit} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
