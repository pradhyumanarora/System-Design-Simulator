import type { ComponentKind } from '@sds/shared/src/index';

export interface NodeConfig {
  emoji: string;
  color: string;
  handleIn: string;
  handleOut: string;
  maxConnections: number;
}

export const nodeConfigs: Record<ComponentKind, NodeConfig> = {
  client:           { emoji: '💻', color: '#1e293b', handleIn: 'client_in',  handleOut: 'client_out',  maxConnections: 2 },
  'api-gateway':    { emoji: '🚪', color: '#0f172a', handleIn: 'gateway_in', handleOut: 'gateway_out', maxConnections: 2 },
  'load-balancer':  { emoji: '⚖️', color: '#0c1a2e', handleIn: 'lb_in',      handleOut: 'lb_out',      maxConnections: 2 },
  'web-server':     { emoji: '🖥️', color: '#172554', handleIn: 'server_in',  handleOut: 'server_out',  maxConnections: 2 },
  'database-sql':   { emoji: '🗄️', color: '#14532d', handleIn: 'sqldb_in',   handleOut: 'sqldb_out',   maxConnections: 2 },
  'database-nosql': { emoji: '🌿', color: '#14532d', handleIn: 'nosqldb_in', handleOut: 'nosqldb_out', maxConnections: 2 },
  cache:            { emoji: '⚡', color: '#78350f', handleIn: 'cache_in',   handleOut: 'cache_out',   maxConnections: 2 },
  'message-queue':  { emoji: '📫', color: '#3b0764', handleIn: 'mq_in',      handleOut: 'mq_out',      maxConnections: 2 },
  cdn:              { emoji: '🌐', color: '#0c4a6e', handleIn: 'cdn_in',     handleOut: 'cdn_out',     maxConnections: 2 },
  storage:          { emoji: '🗂️', color: '#422006', handleIn: 'storage_in', handleOut: 'storage_out', maxConnections: 2 },
  dns:              { emoji: '🔡', color: '#1c1917', handleIn: 'dns_in',     handleOut: 'dns_out',     maxConnections: 2 },
};

export function getHandleIds(nodeKind: ComponentKind) {
  const config = nodeConfigs[nodeKind];
  return { in: config.handleIn, out: config.handleOut };
}
