import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

function NodeBase({
  label,
  emoji,
  selected,
  color,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  color: string;
}) {
  return (
    <div
      style={{
        background: color,
        border: `2px solid ${selected ? '#6366f1' : '#334155'}`,
        borderRadius: 10,
        padding: '8px 14px',
        minWidth: 120,
        textAlign: 'center',
        boxShadow: selected ? '0 0 0 3px #6366f180' : '0 2px 8px #0004',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export function ClientNode({ data, selected }: NodeProps) {
  return (
    <>
      <NodeBase label={(data as any).label ?? 'Client'} emoji="💻" selected={!!selected} color="#1e293b" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function ApiGatewayNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'API Gateway'} emoji="🚪" selected={!!selected} color="#0f172a" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function LoadBalancerNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'Load Balancer'} emoji="⚖️" selected={!!selected} color="#0c1a2e" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function WebServerNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'Web Server'} emoji="🖥️" selected={!!selected} color="#172554" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function DatabaseSqlNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'SQL Database'} emoji="🗄️" selected={!!selected} color="#14532d" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function DatabaseNoSqlNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'NoSQL Database'} emoji="🍃" selected={!!selected} color="#14532d" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function CacheNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'Cache'} emoji="⚡" selected={!!selected} color="#78350f" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function MessageQueueNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'Message Queue'} emoji="📬" selected={!!selected} color="#3b0764" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function CdnNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'CDN'} emoji="🌐" selected={!!selected} color="#0c4a6e" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function StorageNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'Storage'} emoji="🗂️" selected={!!selected} color="#422006" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}

export function DnsNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeBase label={(data as any).label ?? 'DNS'} emoji="🔡" selected={!!selected} color="#1c1917" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}
