// Map node kinds to their handle IDs
export const handleIdMap: Record<string, { in: string; out: string }> = {
  client: { in: 'client_in', out: 'client_out' },
  'api-gateway': { in: 'gateway_in', out: 'gateway_out' },
  'load-balancer': { in: 'lb_in', out: 'lb_out' },
  'web-server': { in: 'server_in', out: 'server_out' },
  'database-sql': { in: 'sqldb_in', out: 'sqldb_out' },
  'database-nosql': { in: 'nosqldb_in', out: 'nosqldb_out' },
  cache: { in: 'cache_in', out: 'cache_out' },
  'message-queue': { in: 'mq_in', out: 'mq_out' },
  cdn: { in: 'cdn_in', out: 'cdn_out' },
  storage: { in: 'storage_in', out: 'storage_out' },
  dns: { in: 'dns_in', out: 'dns_out' },
};

export function getHandleIds(nodeKind: string) {
  return handleIdMap[nodeKind] || { in: 'in', out: 'out' };
}
