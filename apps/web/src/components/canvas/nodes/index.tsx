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
        width: 120,
        height: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: selected ? '0 0 0 3px #6366f180' : '0 2px 8px #0004',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 24 }}>{emoji}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

export function ClientNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="client_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Client'} emoji="💻" selected={!!selected} color="#1e293b" />
      <Handle id="client_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function ApiGatewayNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="gateway_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'API Gateway'} emoji="🚪" selected={!!selected} color="#0f172a" />
      <Handle id="gateway_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function LoadBalancerNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="lb_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Load Balancer'} emoji="⚖️" selected={!!selected} color="#0c1a2e" />
      <Handle id="lb_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function WebServerNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="server_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Web Server'} emoji="🖥️" selected={!!selected} color="#172554" />
      <Handle id="server_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function DatabaseSqlNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="sqldb_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'SQL Database'} emoji="🗄️" selected={!!selected} color="#14532d" />
      <Handle id="sqldb_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function DatabaseNoSqlNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="nosqldb_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'NoSQL Database'} emoji="🌿" selected={!!selected} color="#14532d" />
      <Handle id="nosqldb_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function CacheNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="cache_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Cache'} emoji="⚡" selected={!!selected} color="#78350f" />
      <Handle id="cache_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function MessageQueueNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="mq_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Message Queue'} emoji="📫" selected={!!selected} color="#3b0764" />
      <Handle id="mq_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function CdnNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="cdn_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'CDN'} emoji="🌐" selected={!!selected} color="#0c4a6e" />
      <Handle id="cdn_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function StorageNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="storage_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'Storage'} emoji="🗂️" selected={!!selected} color="#422006" />
      <Handle id="storage_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}

export function DnsNode({ data, selected }: NodeProps) {
  return (
    <>
      <Handle id="dns_in" type="target" position={Position.Left} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
      <NodeBase label={(data as any).label ?? 'DNS'} emoji="🔡" selected={!!selected} color="#1c1917" />
      <Handle id="dns_out" type="source" position={Position.Right} isConnectable={true} style={{ background: '#f97316', width: 12, height: 12 }} />
    </>
  );
}
