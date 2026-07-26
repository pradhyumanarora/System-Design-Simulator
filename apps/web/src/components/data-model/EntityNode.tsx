import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { DataModelField } from '@sds/shared/src/index';

export interface EntityNodeData extends Record<string, unknown> {
  name: string;
  fields: DataModelField[];
}

export type EntityFlowNode = Node<EntityNodeData, 'entity'>;

function EntityNodeInner({ data, selected, isConnectable }: NodeProps<EntityFlowNode>) {
  return (
    <div
      style={{
        background: '#172033',
        border: `2px solid ${selected ? '#f97316' : '#475569'}`,
        borderRadius: 10,
        boxShadow: selected ? '0 0 0 3px #f9731640' : '0 8px 18px #0005',
        boxSizing: 'border-box',
        color: '#e2e8f0',
        minHeight: 88,
        overflow: 'hidden',
        width: 240,
      }}
    >
      <Handle
        id="relation-in"
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={handleStyle}
      />
      <div
        style={{
          background: '#243047',
          borderBottom: '1px solid #475569',
          fontSize: 13,
          fontWeight: 800,
          padding: '10px 12px',
        }}
      >
        {data.name || 'Untitled Entity'}
      </div>
      <div style={{ padding: '6px 0' }}>
        {data.fields.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 11, padding: '8px 12px' }}>
            No fields yet
          </div>
        ) : (
          data.fields.map((field) => (
            <div
              key={field.id}
              style={{
                alignItems: 'center',
                display: 'flex',
                fontSize: 11,
                gap: 8,
                padding: '5px 12px',
              }}
            >
              <span style={{ color: field.isPrimaryKey ? '#fbbf24' : '#64748b', width: 14 }}>
                {field.isPrimaryKey ? '◆' : '•'}
              </span>
              <span style={{ flex: 1, fontWeight: field.isPrimaryKey ? 700 : 500 }}>
                {field.name || 'field'}
              </span>
              <span style={{ color: '#94a3b8' }}>{field.dataType}</span>
              {field.isNullable && <span style={{ color: '#64748b' }}>?</span>}
            </div>
          ))
        )}
      </div>
      <Handle
        id="relation-out"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={handleStyle}
      />
    </div>
  );
}

const handleStyle = {
  background: '#f97316',
  border: '2px solid #172033',
  height: 12,
  width: 12,
};

export const EntityNode = memo(EntityNodeInner);
