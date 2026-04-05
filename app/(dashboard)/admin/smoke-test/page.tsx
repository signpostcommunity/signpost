'use client'

import { useState } from 'react'
import type { RlsTestSuite, RlsTestResult } from '@/lib/rls-smoke-tests'
import { storageBuckets } from '@/lib/rls-smoke-tests'

export default function SmokeTestPage() {
  const [suite, setSuite] = useState<RlsTestSuite | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runTests() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/smoke-test', { method: 'POST' })
      if (res.status === 401 || res.status === 403) {
        setError('Access denied — admin only')
        return
      }
      if (!res.ok) {
        setError(`Error: ${res.status}`)
        return
      }
      const data: RlsTestSuite = await res.json()
      setSuite(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  function statusBadge(r: RlsTestResult) {
    if (r.error) return <span style={{ color: '#ff9800', fontWeight: 600 }}>ERROR</span>
    if (r.passed) return <span style={{ color: '#4caf50', fontWeight: 600 }}>PASS</span>
    return <span style={{ color: '#f44336', fontWeight: 600 }}>FAIL</span>
  }

  function typeBadge(type: string) {
    const color = type === 'positive' ? '#00e5ff' : '#ff6b85'
    return <span style={{ color, fontSize: 12, textTransform: 'uppercase' as const }}>{type}</span>
  }

  return (
    <div style={{ padding: '32px 24px', color: 'var(--text)' }}>
      <h1 style={{ fontFamily: 'var(--font-syne)', fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
        RLS Smoke Tests
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Tests RLS policies by running direct queries as the logged-in admin and checking data visibility.
      </p>

      <button
        onClick={runTests}
        disabled={loading}
        style={{
          background: loading ? '#333' : '#ff7e45',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 24,
        }}
      >
        {loading ? 'Running...' : 'Run Tests'}
      </button>

      {error && (
        <div style={{ background: '#2a1520', border: '1px solid #ff6b85', borderRadius: 10, padding: 16, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {suite && (
        <>
          {/* Summary bar */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap',
          }}>
            <SummaryCard label="Total" value={suite.summary.total} color="#c8cfe0" />
            <SummaryCard label="Passed" value={suite.summary.passed} color="#4caf50" />
            <SummaryCard label="Failed" value={suite.summary.failed} color="#f44336" />
            <SummaryCard label="Errors" value={suite.summary.errors} color="#ff9800" />
          </div>

          <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>
            Last run: {new Date(suite.timestamp).toLocaleString()}
          </p>

          {/* Results table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={thStyle}>Test</th>
                  <th style={thStyle}>Table</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Expected</th>
                  <th style={thStyle}>Actual</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {suite.results.map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: r.error ? 'rgba(255,152,0,0.05)' : !r.passed ? 'rgba(244,67,54,0.05)' : 'transparent',
                  }}>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>{r.table}</td>
                    <td style={tdStyle}>{r.role}</td>
                    <td style={tdStyle}>{typeBadge(r.type)}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{r.expected}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{r.actual}</td>
                    <td style={tdStyle}>
                      {statusBadge(r)}
                      {r.error && <div style={{ fontSize: 11, color: '#ff9800', marginTop: 2 }}>{r.error}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Storage buckets */}
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: 20, fontWeight: 600, marginTop: 40, marginBottom: 16 }}>
            Storage Buckets
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={thStyle}>Bucket</th>
                <th style={thStyle}>Public</th>
                <th style={thStyle}>Size Limit</th>
                <th style={thStyle}>Mime Types</th>
              </tr>
            </thead>
            <tbody>
              {storageBuckets.map((b, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{b.name}</td>
                  <td style={tdStyle}>{b.public ? 'Yes' : 'No'}</td>
                  <td style={tdStyle}>{b.fileSizeLimit}</td>
                  <td style={{ ...tdStyle, fontSize: 11 }}>{b.mimeTypes.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '12px 20px',
      minWidth: 100,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}

const thStyle: React.CSSProperties = { padding: '8px 12px', fontWeight: 600, color: 'var(--muted)', fontSize: 12 }
const tdStyle: React.CSSProperties = { padding: '8px 12px' }
