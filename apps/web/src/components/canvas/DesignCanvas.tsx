import { useCallback } from 'react';
import { ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDesignStore } from '../../store/useDesignStore';
import {
  ClientNode, ApiGatewayNode, LoadBalancerNode, WebServerNode,
  DatabaseSqlNode, DatabaseNoSqlNode, CacheNode, MessageQueueNode,
  CdnNode, StorageNode, DnsNode,
} from './nodes';

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

  // Map ComponentSpec to ReactFlow node shape
  const nodes = components.map((c) => ({
    id: c.id,
    type: c.kind,
    position: c.position,
    data: { label: c.label, config: c.config },
  }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges as any}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        style={{ background: '#0f172a' }}
      >
        <Background color="#1e293b" variant={BackgroundVariant.Dots} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
        <MiniMap
          nodeColor="#6366f1"
          style={{ background: '#1e293b', border: '1px solid #334155' }}
        />
      </ReactFlow>
    </div>
  );
}
