import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDesignStore } from '../../store/useDesignStore';
import {
  ClientNode, ApiGatewayNode, LoadBalancerNode, WebServerNode,
  DatabaseSqlNode, DatabaseNoSqlNode, CacheNode, MessageQueueNode,
  CdnNode, StorageNode, DnsNode,
} from './nodes';

// Move nodeTypes outside component to prevent recreation on every render
const nodeTypes = {
  client: ClientNode,
  'api-gateway': ApiGatewayNode,
  'load-balancer': LoadBalancerNode,
  'web-server': WebServerNode,
  'database-sql': DatabaseSqlNode,
  'database-nosql': DatabaseNoSqlNode,
  cache: CacheNode,
  'message-queue': MessageQueueNode,
  cdn: CdnNode,
  storage: StorageNode,
  dns: DnsNode,
};

export function DesignCanvas() {
  const { components, edges, onNodesChange, onEdgesChange, onConnect, setSelected } =
    useDesignStore();

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelected(node.id);
    },
    [setSelected]
  );

  const handlePaneClick = useCallback(() => {
    setSelected(null);
  }, [setSelected]);

  // Memoize nodes to prevent constant recalculation
  const nodes = useMemo(() => 
    components.map((c) => ({
      id: c.id,
      type: c.kind,
      position: c.position,
      data: { label: c.label, config: c.config },
    })),
    [components]
  );

  // Memoize edges to prevent constant recalculation
  const styledEdges = useMemo(() => 
    edges.map((e) => ({
      ...e,
      style: { stroke: '#f97316', strokeWidth: 3 },
      animated: true,
    })),
    [edges]
  );

  console.log('[SDS:canvas] nodes:', nodes.length, nodes.map(n => n.type));
  console.log('[SDS:canvas] edges:', styledEdges.length, styledEdges);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Debug info */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', zIndex: 10, fontSize: '12px' }}>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {styledEdges.length}</div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges as any}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodesConnectable={true}
        connectionMode={ConnectionMode.Loose}
        style={{ background: '#0f172a', flex: 1 }}
      >
        <Background color="#1e293b" variant={BackgroundVariant.Dots} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
      </ReactFlow>
    </div>
  );
}
