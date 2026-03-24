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
}

export default function InterpreterGrid({ interpreters, onVideoPreview, onAddToList, userRole, contextParam, awayPeriods }: Props) {
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

          return (
            <div key={i.id} style={{ position: 'relative', opacity: shouldDim ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <InterpreterCard
                interpreter={i}
                onVideoPreview={onVideoPreview}
                onAddToList={onAddToList}
                userRole={userRole}
                contextParam={contextParam}
              />
              {shouldDim && (
                <span style={{
                  position: 'absolute', top: 10, left: 10, zIndex: 2,
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
        @media (max-width: 1024px) {
          .interp-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .interp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 420px) {
          .interp-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </>
  );
}
