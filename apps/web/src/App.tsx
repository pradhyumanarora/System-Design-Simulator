import { useCallback } from 'react';
import { DesignCanvas } from './components/canvas/DesignCanvas';
import { ComponentPalette } from './components/sidebar/ComponentPalette';
import { ConfigPanel } from './components/config/ConfigPanel';
import { useDesignStore } from './store/useDesignStore';
import type { ComponentKind } from '@sds/shared/src/index';
import './index.css';

let idCounter = 0;
const nextId = () => `comp-${++idCounter}`;

export default function App() {
  const { addComponent, clearCanvas } = useDesignStore();

  const handleAdd = useCallback(
    (kind: ComponentKind) => {
      addComponent({
        id: nextId(),
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
          gap: 16,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
          ⚙️ System Design Simulator
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={clearCanvas}
          style={{
            background: '#334155',
            border: 'none',
            borderRadius: 6,
            color: '#e2e8f0',
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Clear
        </button>
      </header>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ComponentPalette onAdd={handleAdd} />
        <main style={{ flex: 1, position: 'relative' }}>
          <DesignCanvas />
        </main>
        <ConfigPanel />
      </div>
    </div>
  );
}
