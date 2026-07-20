import { useDesignStore } from '../../store/useDesignStore';

export function ConfigPanel() {
  const { components, selectedId, updateComponent } = useDesignStore();

  const component = components.find((c) => c.id === selectedId);

  if (!component) {
    return (
      <aside
        style={{
          width: 240,
          background: '#1e293b',
          borderLeft: '1px solid #334155',
          padding: 20,
          color: '#64748b',
          fontSize: 13,
        }}
      >
        <p>Select a component to configure it.</p>
      </aside>
    );
  }

  const cfg = component.config ?? {};

  const set = (key: string, value: number) =>
    updateComponent(component.id, { config: { ...cfg, [key]: value } as any });

  const field = (label: string, key: string, unit: string) => (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min={0}
          value={(cfg as any)[key] ?? 1}
          onChange={(e) => set(key, Number(e.target.value))}
          style={{
            flex: 1,
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#e2e8f0',
            padding: '4px 8px',
            fontSize: 13,
          }}
        />
        <span style={{ fontSize: 11, color: '#64748b' }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <aside
      style={{
        width: 240,
        background: '#1e293b',
        borderLeft: '1px solid #334155',
        padding: 20,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 16 }}>
        CONFIGURE
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
        {component.label}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 20 }}>
        {component.kind}
      </div>

      {field('Replicas', 'replicas', 'nodes')}
      {field('Read Throughput', 'readThroughput', 'req/s')}
      {field('Write Throughput', 'writeThroughput', 'req/s')}
      {field('Latency SLA', 'latencySlaMs', 'ms')}
    </aside>
  );
}
