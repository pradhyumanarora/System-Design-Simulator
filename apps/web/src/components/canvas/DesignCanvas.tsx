import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
} from '@xyflow/react';
import type { Edge, NodeChange, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './xy-theme.css';
import { useDesignStore } from '../../store/useDesignStore';
import { GenericSystemNode } from './nodes';
import type { SystemNode } from './nodes';
import { CustomOrangeEdge } from './CustomOrangeEdge';

type SystemEdge = Edge<Record<string, never>, 'orange'>;

const nodeTypes: NodeTypes = {
  client:           GenericSystemNode,
  'api-gateway':    GenericSystemNode,
  'load-balancer':  GenericSystemNode,
  'web-server':     GenericSystemNode,
  'database-sql':   GenericSystemNode,
  'database-nosql': GenericSystemNode,
  cache:            GenericSystemNode,
  'message-queue':  GenericSystemNode,
  cdn:              GenericSystemNode,
  storage:          GenericSystemNode,
  dns:              GenericSystemNode,
};

const edgeTypes = {
  orange: CustomOrangeEdge,
};

const defaultEdgeOptions = {
  type: 'orange',
} as const;

export function DesignCanvas() {
  const [nodeMeasurements, setNodeMeasurements] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const {
    components,
    edges,
    selectedId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelected,
  } = useDesignStore();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: SystemNode) => {
      setSelected(node.id);
    },
    [setSelected]
  );

  const handlePaneClick = useCallback(() => {
    setSelected(null);
  }, [setSelected]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<SystemNode>[]) => {
      const measurements = changes.filter(
        (change) => change.type === 'dimensions' && change.dimensions
      );

      if (measurements.length > 0) {
        setNodeMeasurements((current) => {
          const next = { ...current };
          for (const change of measurements) {
            if (change.type === 'dimensions' && change.dimensions) {
              next[change.id] = change.dimensions;
            }
          }
          return next;
        });
      }

      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const nodes = useMemo<SystemNode[]>(() =>
    components.map((c) => ({
      id: c.id,
      type: c.kind,
      position: c.position,
      data: { label: c.label, config: c.config },
      selected: c.id === selectedId,
      initialWidth: 120,
      initialHeight: 80,
      measured: nodeMeasurements[c.id],
    })),
    [components, nodeMeasurements, selectedId]
  );

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      <ReactFlow<SystemNode, SystemEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: '#0f172a', flex: 1 }}
      >
        <Background color="#1e293b" variant={BackgroundVariant.Dots} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
      </ReactFlow>
    </div>
  );
}
