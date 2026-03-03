'use client';

import { useState } from 'react';

const THREADS = [
  { id: '1', from: 'Tech Inc', lastMessage: 'Can we confirm the remote setup details?', time: '10:32 AM', unread: true },
  { id: '2', from: 'Greenway School', lastMessage: 'Looking forward to working with you.', time: 'Yesterday', unread: false },
  { id: '3', from: 'Law & Partners', lastMessage: 'Please bring your ID for building access.', time: 'Mar 1', unread: false },
];

const MESSAGES: Record<string, { sender: string; body: string; time: string; own?: boolean }[]> = {
  '1': [
    { sender: 'Tech Inc', body: 'Hi, we\'re looking forward to the session on March 20.', time: '9:00 AM' },
    { sender: 'You', body: 'Great! I\'ll be available via Teams. What format is the meeting?', time: '9:15 AM', own: true },
    { sender: 'Tech Inc', body: 'It\'ll be a product demo for our international client. Can we confirm the remote setup details?', time: '10:32 AM' },
  ],
  '2': [
    { sender: 'Greenway School', body: 'Looking forward to working with you.', time: 'Yesterday' },
  ],
  '3': [
    { sender: 'Law & Partners', body: 'Please bring your ID for building access.', time: 'Mar 1' },
  ],
};

export default function InboxPage() {
  const [activeThread, setActiveThread] = useState('1');
  const [newMessage, setNewMessage] = useState('');

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 160px)', gap: '0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Thread list */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.9rem' }}>Inbox</div>
        {THREADS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveThread(t.id)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '14px 16px',
              background: activeThread === t.id ? 'var(--surface2)' : 'none',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span style={{ fontWeight: t.unread ? 700 : 500, fontSize: '0.88rem', color: 'var(--text)' }}>{t.from}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t.time}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.unread && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', marginRight: '5px', verticalAlign: 'middle' }} />}
              {t.lastMessage}
            </div>
          </button>
        ))}
      </div>

      {/* Message area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem' }}>
          {THREADS.find((t) => t.id === activeThread)?.from}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(MESSAGES[activeThread] || []).map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.own ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: msg.own ? 'rgba(0,229,255,0.12)' : 'var(--surface2)',
                border: `1px solid ${msg.own ? 'rgba(0,229,255,0.25)' : 'var(--border)'}`,
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}>
                {msg.body}
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '4px' }}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && newMessage.trim()) setNewMessage(''); }}
          />
          <button onClick={() => setNewMessage('')} className="btn-primary" style={{ padding: '10px 18px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
