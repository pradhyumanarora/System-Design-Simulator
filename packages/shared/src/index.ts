// ─── Component types ──────────────────────────────────────────────────────────

export type ComponentKind =
  | 'client'
  | 'api-gateway'
  | 'load-balancer'
  | 'web-server'
  | 'database-sql'
  | 'database-nosql'
  | 'cache'
  | 'message-queue'
  | 'cdn'
  | 'storage'
  | 'dns';

export interface ComponentConfig {
  replicas: number;
  readThroughput: number;   // requests/sec
  writeThroughput: number;  // requests/sec
  latencySlaMs: number;
}

export interface ComponentSpec {
  id: string;
  kind: ComponentKind;
  label: string;
  position: { x: number; y: number };
  config: ComponentConfig;
}

export interface EdgeSpec {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: 'orange';
}

export interface DesignState {
  components: ComponentSpec[];
  edges: EdgeSpec[];
}

// ─── Session / room events (Socket.io) ───────────────────────────────────────

export interface SessionEvent {
  type:
    | 'component:add'
    | 'component:update'
    | 'component:remove'
    | 'edge:add'
    | 'edge:remove'
    | 'cursor:move';
  payload: unknown;
  userId: string;
  timestamp: number;
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

export interface ComponentMetrics {
  componentId: string;
  qps: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  isBottleneck: boolean;
  isSinglePointOfFailure: boolean;
}

export interface MetricsSnapshot {
  timestamp: number;
  components: ComponentMetrics[];
  totalQps: number;
  totalP99LatencyMs: number;
}
