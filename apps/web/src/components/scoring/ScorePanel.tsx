import type { ScoreResult } from '../../scoring/scorer';

interface ScorePanelProps {
  result: ScoreResult;
  onClose: () => void;
}

export function ScorePanel({ result, onClose }: ScorePanelProps) {
  const color = result.total >= 80 ? '#a3e635' : result.total >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 12,
          padding: 28,
          minWidth: 380,
          maxWidth: 480,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Design Score</span>
          <span style={{ fontSize: 36, fontWeight: 800, color }}>{result.total}/100</span>
        </div>

        {result.breakdown.map((b) => (
          <div key={b.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: b.passed ? '#e2e8f0' : '#94a3b8' }}>
                {b.passed ? '✅' : '❌'} {b.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: b.passed ? '#a3e635' : '#f87171' }}>
                {b.score}/{b.maxScore}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{b.comment}</div>
          </div>
        ))}

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            background: '#334155',
            border: 'none',
            borderRadius: 8,
            color: '#e2e8f0',
            padding: '8px 0',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}