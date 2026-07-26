import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { DesignCanvas } from './components/canvas/DesignCanvas';
import { ComponentPalette } from './components/sidebar/ComponentPalette';
import { ConfigPanel } from './components/config/ConfigPanel';
import { MetricsPanel } from './components/metrics/MetricsPanel';
import { ScorePanel } from './components/scoring/ScorePanel';
import { DesignNotesPanel } from './components/notes/DesignNotesPanel';
import { useDesignStore } from './store/useDesignStore';
import { useSimulation } from './simulation/useSimulation';
import { scoreDesign } from './scoring/scorer';
import { saveDesign, loadDesign, clearDesign, exportAsPng } from './persistence/storage';
import { SEED_PROBLEMS } from './problems/seedProblems';
import type { ComponentKind } from '@sds/shared/src/index';
import type { ScoreResult } from './scoring/scorer';
import { socket } from './socket';
import './index.css';

export default function App() {
  const { addComponent, clearCanvas, setDesign, components, edges, notes } = useDesignStore();
  const [ingressQps, setIngressQps] = useState(1_000);
  const [activeProblemId, setActiveProblemId] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showProblems, setShowProblems] = useState(false);
  const [showDesignNotes, setShowDesignNotes] = useState(false);

  const metrics = useSimulation(ingressQps);

  // Use a module-level ref so StrictMode double-invoke doesn't emit room:join twice.
  const hasJoinedRef = useRef(false);
  useEffect(() => {
    if (hasJoinedRef.current) return;
    function doJoin() {
      if (hasJoinedRef.current) return;
      hasJoinedRef.current = true;
      socket.emit('room:join', 'default-room');
    }
    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }
    return () => {
      socket.off('connect', doJoin);
    };
  }, []);

  // Auto-save on every change
  useEffect(() => {
    if (
      components.length > 0 ||
      edges.length > 0 ||
      notes.functionalRequirements.length > 0 ||
      notes.apiEndpoints.length > 0 ||
      Object.values(notes.nonFunctionalRequirements).some(Boolean) ||
      notes.dataModel ||
      notes.tradeOffs
    ) {
      saveDesign({ components, edges, notes });
    }
  }, [components, edges, notes]);

  // Restore from localStorage on first load — guard against StrictMode double-invoke
  // by checking whether a component with the same id already exists before adding.
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = loadDesign();
    if (saved) {
      setDesign(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = useCallback(
    (kind: ComponentKind) => {
      addComponent({
        id: crypto.randomUUID(),
        kind,
        label: kind.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        position: {
          x: 400 + (Math.random() - 0.5) * 300,
          y: 300 + (Math.random() - 0.5) * 200,
        },
        config: { replicas: 1, readThroughput: 1000, writeThroughput: 500, latencySlaMs: 100 },
      });
    },
    [addComponent]
  );

  const handleLoadProblem = useCallback(
    (id: string) => {
      const problem = SEED_PROBLEMS.find((p) => p.id === id);
      if (!problem) return;
      setDesign({ components: problem.components, edges: problem.edges, notes: problem.notes });
      setIngressQps(problem.targetQps);
      setActiveProblemId(id);
      setShowProblems(false);
    },
    [setDesign]
  );

  const handleScore = useCallback(() => {
    const problem = SEED_PROBLEMS.find((p) => p.id === activeProblemId);
    const targetQps = problem?.targetQps ?? ingressQps;
    const result = scoreDesign(components, edges, metrics, targetQps);
    setScoreResult(result);
  }, [components, edges, metrics, activeProblemId, ingressQps]);

  const activeProblem = SEED_PROBLEMS.find((p) => p.id === activeProblemId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          height: 48,
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          ⚙️ System Design Simulator
        </span>

        {activeProblem && (
          <span
            style={{
              fontSize: 12,
              color: '#94a3b8',
              background: '#0f172a',
              borderRadius: 6,
              padding: '2px 10px',
            }}
          >
            {activeProblem.title}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <HeaderBtn onClick={() => setShowProblems((v) => !v)}>📋 Problems</HeaderBtn>
        <HeaderBtn onClick={() => setShowDesignNotes((value) => !value)}>📝 Design Notes</HeaderBtn>
        <HeaderBtn onClick={handleScore}>🏆 Score</HeaderBtn>
        <HeaderBtn onClick={() => exportAsPng()}>💾 Export PNG</HeaderBtn>
        <HeaderBtn
          onClick={() => {
            clearCanvas();
            clearDesign();
            setActiveProblemId(null);
          }}
        >
          🗑 Clear
        </HeaderBtn>
      </header>

      {/* Problems dropdown */}
      {showProblems && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 200,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 10,
            padding: 12,
            zIndex: 500,
            minWidth: 320,
            boxShadow: '0 8px 32px #0008',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
            SEED PROBLEMS
          </div>
          {SEED_PROBLEMS.map((prob) => (
            <button
              key={prob.id}
              onClick={() => handleLoadProblem(prob.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: prob.id === activeProblemId ? '#334155' : 'transparent',
                border: 'none',
                borderRadius: 8,
                color: '#e2e8f0',
                padding: '8px 10px',
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{prob.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Target: {(prob.targetQps / 1000).toFixed(0)}K QPS — {prob.description.slice(0, 60)}…
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ComponentPalette onAdd={handleAdd} />
        <ReactFlowProvider>
          <main style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
            <DesignCanvas />
          </main>
        </ReactFlowProvider>
        <ConfigPanel />
        <MetricsPanel
          metrics={metrics}
          ingressQps={ingressQps}
          onIngressChange={setIngressQps}
        />
      </div>

      {scoreResult && (
        <ScorePanel result={scoreResult} onClose={() => setScoreResult(null)} />
      )}
      {showDesignNotes && (
        <DesignNotesPanel onClose={() => setShowDesignNotes(false)} />
      )}
    </div>
  );
}

function HeaderBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#334155',
        border: 'none',
        borderRadius: 6,
        color: '#e2e8f0',
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
