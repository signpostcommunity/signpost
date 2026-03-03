import type { Interpreter } from '@/lib/types';
import InterpreterCard from './InterpreterCard';

interface Props {
  interpreters: Interpreter[];
}

export default function InterpreterGrid({ interpreters }: Props) {
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
      }}
    >
      {interpreters.map((i) => (
        <InterpreterCard key={i.id} interpreter={i} />
      ))}
    </div>
  );
}
