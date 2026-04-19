import type { Interpreter } from '@/lib/types';
import InterpreterCard from './InterpreterCard';

interface AwayInfo {
  end_date: string
  message: string
  dim_profile: boolean
}

interface Props {
  interpreters: Interpreter[];
  onVideoPreview?: (interpreter: Interpreter) => void;
  onAddToList?: (interpreter: Interpreter) => void;
  userRole?: string | null;
  contextParam?: string | null;
  awayPeriods?: Record<string, AwayInfo>;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  addedIds?: Set<string>;
}

export default function InterpreterGrid({ interpreters, onVideoPreview, onAddToList, userRole, contextParam, awayPeriods, selectionMode, selectedIds, onToggleSelect, addedIds }: Props) {
  if (interpreters.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: 'var(--muted)',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔍</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
          No interpreters found
        </div>
        <div style={{ fontSize: '0.9rem' }}>Try adjusting your filters.</div>
      </div>
    );
  }

  return (
    <>
      <div
        className="interp-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          paddingRight: '8px',
        }}
      >
        {interpreters.map((i) => {
          const away = awayPeriods?.[String(i.id)]
          const shouldDim = away?.dim_profile === true

          const isSelected = selectionMode && selectedIds?.has(String(i.id))

          return (
            <div key={i.id} style={{
              position: 'relative',
              opacity: shouldDim ? 0.6 : 1,
              transition: 'opacity 0.2s',
              ...(isSelected ? { boxShadow: '0 0 0 2px var(--accent)', borderRadius: 'var(--radius)' } : {}),
            }}>
              {/* Selection checkbox overlay */}
              {selectionMode && (
                <button
                  type="button"
                  aria-label={isSelected ? `Deselect ${i.name}` : `Select ${i.name}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onToggleSelect?.(String(i.id))
                  }}
                  style={{
                    position: 'absolute', top: 12, left: 12, zIndex: 10,
                    width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${isSelected ? 'var(--accent)' : '#8891a8'}`,
                    background: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0, transition: 'all 0.15s',
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8l3 3 5-6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              )}
              <InterpreterCard
                interpreter={i}
                onVideoPreview={onVideoPreview}
                onAddToList={onAddToList}
                userRole={userRole}
                contextParam={contextParam}
                isOnList={addedIds?.has(String(i.id))}
              />
              {shouldDim && (
                <span style={{
                  position: 'absolute', top: 10, left: selectionMode ? 44 : 10, zIndex: 2,
                  background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '2px 8px',
                  fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)',
                  fontFamily: "'DM Sans', sans-serif", pointerEvents: 'none',
                }}>
                  Away
                </span>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 1199px) {
          .interp-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .interp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 479px) {
          .interp-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </>
  );
}
