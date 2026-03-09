import type { Interpreter } from '@/lib/types';
import InterpreterCard from './InterpreterCard';

interface Props {
  interpreters: Interpreter[];
  onVideoPreview?: (interpreter: Interpreter) => void;
  onAddToList?: (interpreter: Interpreter) => void;
}

export default function InterpreterGrid({ interpreters, onVideoPreview, onAddToList }: Props) {
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
        <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
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
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        {interpreters.map((i) => (
          <InterpreterCard
            key={i.id}
            interpreter={i}
            onVideoPreview={onVideoPreview}
            onAddToList={onAddToList}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 1400px) {
          .interp-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 1024px) {
          .interp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .interp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
