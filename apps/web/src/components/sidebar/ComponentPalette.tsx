import type { ComponentKind } from '@sds/shared/src/index';

interface PaletteItem {
  kind: ComponentKind;
  label: string;
  emoji: string;
  description: string;
}

const PALETTE: PaletteItem[] = [
  { kind: 'client', label: 'Client', emoji: '💻', description: 'Browser / mobile client' },
  { kind: 'dns', label: 'DNS', emoji: '🔡', description: 'Domain name resolution' },
  { kind: 'cdn', label: 'CDN', emoji: '🌐', description: 'Content delivery network' },
  { kind: 'api-gateway', label: 'API Gateway', emoji: '🚪', description: 'Edge request router' },
  { kind: 'load-balancer', label: 'Load Balancer', emoji: '⚖️', description: 'Distributes traffic' },
  { kind: 'web-server', label: 'Web Server', emoji: '🖥️', description: 'Application / service' },
  { kind: 'cache', label: 'Cache', emoji: '⚡', description: 'Redis / Memcached layer' },
  { kind: 'database-sql', label: 'SQL DB', emoji: '🗄️', description: 'Relational database' },
  { kind: 'database-nosql', label: 'NoSQL DB', emoji: '🍃', description: 'Document / KV store' },
  { kind: 'message-queue', label: 'Message Queue', emoji: '📬', description: 'Async messaging' },
  { kind: 'storage', label: 'Storage', emoji: '🗂️', description: 'Blob / object storage' },
];

interface ComponentPaletteProps {
  onAdd: (kind: ComponentKind) => void;
}

export function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <aside
      style={{
        width: 200,
        background: '#1e293b',
        borderRight: '1px solid #334155',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', padding: '0 8px 8px' }}>
        COMPONENTS
      </div>
      {PALETTE.map((item) => (
        <button
          key={item.kind}
          onClick={() => onAdd(item.kind)}
          title={item.description}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 8,
            padding: '8px 10px',
            cursor: 'pointer',
            color: '#e2e8f0',
            textAlign: 'left',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#334155';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
          }}
        >
          <span style={{ fontSize: 20 }}>{item.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
