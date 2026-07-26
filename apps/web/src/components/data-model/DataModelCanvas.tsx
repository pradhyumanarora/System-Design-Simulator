import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
} from '@xyflow/react';
import type { Edge, EdgeChange, NodeChange, NodeTypes } from '@xyflow/react';
import type { RelationCardinality } from '@sds/shared/src/index';
import { useDesignStore } from '../../store/useDesignStore';
import { EntityNode } from './EntityNode';
import type { EntityFlowNode } from './EntityNode';

type RelationEdge = Edge<Record<string, never>, 'smoothstep'> & {
  cardinality: RelationCardinality;
};

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

const cardinalityLabels = {
  'one-to-one': '1 : 1',
  'one-to-many': '1 : N',
  'many-to-many': 'N : N',
} as const;

export function DataModelCanvas() {
  const [nodeMeasurements, setNodeMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const {
    schema,
    selectedEntityId,
    onSchemaNodesChange,
    onSchemaEdgesChange,
    onSchemaConnect,
    setSelectedEntity,
  } = useDesignStore();

  const nodes = useMemo<EntityFlowNode[]>(
    () => schema.entities.map((entity) => ({
      id: entity.id,
      type: 'entity',
      position: entity.position,
      data: { name: entity.name, fields: entity.fields },
      selected: entity.id === selectedEntityId,
      initialWidth: 240,
      initialHeight: Math.max(88, 52 + entity.fields.length * 27),
      measured: nodeMeasurements[entity.id],
    })),
    [nodeMeasurements, schema.entities, selectedEntityId]
  );

  const edges = useMemo<RelationEdge[]>(
    () => schema.relations.map((relation) => ({
      id: relation.id,
      source: relation.source,
      target: relation.target,
      sourceHandle: 'relation-out',
      targetHandle: 'relation-in',
      type: 'smoothstep',
      cardinality: relation.cardinality,
      selected: relation.selected,
      label: cardinalityLabels[relation.cardinality],
      labelStyle: { fill: '#f8fafc', fontSize: 11, fontWeight: 700 },
      labelShowBg: true,
      labelBgStyle: { fill: '#334155' },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
      style: { stroke: '#f97316', strokeWidth: 2 },
    })),
    [schema.relations]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<EntityFlowNode>[]) => {
      const measuredChanges = changes.filter(
        (change) => change.type === 'dimensions' && change.dimensions
      );
      if (measuredChanges.length > 0) {
        setNodeMeasurements((current) => {
          const next = { ...current };
          for (const change of measuredChanges) {
            if (change.type === 'dimensions' && change.dimensions) {
              next[change.id] = change.dimensions;
            }
          }
          return next;
        });
      }
      onSchemaNodesChange(changes);
    },
    [onSchemaNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<RelationEdge>[]) => onSchemaEdgesChange(changes),
    [onSchemaEdgesChange]
  );

  return (
    <ReactFlow<EntityFlowNode, RelationEdge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={onSchemaConnect}
      onNodeClick={(_, node) => setSelectedEntity(node.id)}
      onPaneClick={() => setSelectedEntity(null)}
      deleteKeyCode={['Backspace', 'Delete']}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      style={{ background: '#0f172a' }}
    >
      <Background color="#1e293b" variant={BackgroundVariant.Dots} />
      <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
    </ReactFlow>
  );
}
