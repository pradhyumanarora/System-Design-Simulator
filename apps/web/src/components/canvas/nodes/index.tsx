import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { ComponentKind, ComponentConfig } from '@sds/shared/src/index';
import { nodeConfigs } from '../handleIdMap';

export interface NodeData extends Record<string, unknown> {
  label: string;
  config: ComponentConfig;
}

export type SystemNode = Node<NodeData, ComponentKind>;

function NodeShell({
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
        boxSizing: 'border-box',
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

const HANDLE_STYLE = { background: '#f97316', width: 12, height: 12 };

function GenericSystemNodeInner({ type, data, selected, isConnectable }: NodeProps<SystemNode>) {
  const config = nodeConfigs[type];

  return (
    <>
      <Handle
        id={config.handleIn}
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={HANDLE_STYLE}
      />
      <NodeShell
        label={data.label}
        emoji={config.emoji}
        selected={selected}
        color={config.color}
      />
      <Handle
        id={config.handleOut}
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={HANDLE_STYLE}
      />
    </>
  );
}

export const GenericSystemNode = memo(GenericSystemNodeInner);
