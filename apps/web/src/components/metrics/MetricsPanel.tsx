import type { MetricsSnapshot, ComponentMetrics } from '@sds/shared/src/index';
import { useDesignStore } from '../../store/useDesignStore';

interface MetricsPanelProps {
  metrics: MetricsSnapshot | null;
  ingressQps: number;
  onIngressChange: (qps: number) => void;
}

function fmt(n: number, digits = 0) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(digits);
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        background: color,
        color: '#fff',
        borderRadius: 4,
        padding: '1px 5px',
        marginLeft: 4,
        verticalAlign: 'middle',
      }}
    >
      {label}
    </span>
  );
}

function NodeRow({ m, label }: { m: ComponentMetrics; label: string }) {
  const utilPercent = Math.round((m.qps / Math.max(1, m.qps)) * 100);
  void utilPercent; // utilization bar width driven by p99 color
  return (
    <div
      style={{
        padding: '8px 0',
        borderBottom: '1px solid #1e293b',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>
          {label}
          {m.isBottleneck && <Badge label="BOTTLENECK" color="#dc2626" />}
          {m.isSinglePointOfFailure && <Badge label="SPOF" color="#d97706" />}
        </span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmt(m.qps)} qps</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#64748b' }}>
          p50 <span style={{ color: '#a3e635' }}>{m.p50LatencyMs.toFixed(0)}ms</span>
        </span>
        <span style={{ fontSize: 10, color: '#64748b' }}>
          p99{' '}
          <span style={{ color: m.p99LatencyMs > m.p50LatencyMs * 2 ? '#f87171' : '#a3e635' }}>
            {m.p99LatencyMs.toFixed(0)}ms
          </span>
        </span>
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics, ingressQps, onIngressChange }: MetricsPanelProps) {
  const components = useDesignStore((s) => s.components);

  const labelMap = new Map(components.map((c) => [c.id, c.label]));

  return (
    <aside
      style={{
        width: 220,
        background: '#0f172a',
        borderLeft: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #334155',
          fontSize: 11,
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.1em',
        }}
      >
        LIVE METRICS
      </div>

      {/* Ingress QPS control */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b' }}>
        <label htmlFor="ingress-qps" style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>
          Ingress QPS
        </label>
        <input
          id="ingress-qps"
          name="ingressQps"
          type="number"
          min={1}
          value={ingressQps}
          onChange={(e) => onIngressChange(Math.max(1, Number(e.target.value)))}
          style={{
            width: '100%',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#e2e8f0',
            padding: '4px 8px',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Totals */}
      {metrics && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Total QPS</span>
            <span style={{ fontSize: 12, color: '#a3e635', fontWeight: 700 }}>
              {fmt(metrics.totalQps)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>System p99</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: metrics.totalP99LatencyMs > 500 ? '#f87171' : '#a3e635',
              }}
            >
              {metrics.totalP99LatencyMs.toFixed(0)}ms
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>Bottlenecks</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>
              {metrics.components.filter((m) => m.isBottleneck).length}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>SPOFs</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
              {metrics.components.filter((m) => m.isSinglePointOfFailure).length}
            </span>
          </div>
        </div>
      )}

      {/* Per-node rows */}
      <div style={{ padding: '0 16px', flex: 1 }}>
        {metrics?.components.map((m) => (
          <NodeRow key={m.componentId} m={m} label={labelMap.get(m.componentId) ?? m.componentId} />
        ))}
        {!metrics && (
          <p style={{ fontSize: 12, color: '#475569', marginTop: 16 }}>
            Add components to start simulation.
          </p>
        )}
      </div>
    </aside>
  );
}