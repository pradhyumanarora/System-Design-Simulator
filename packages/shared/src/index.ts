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

export interface FunctionalRequirement {
  id: string;
  text: string;
  completed: boolean;
}

export interface NonFunctionalRequirements {
  availability: string;
  latency: string;
  scale: string;
  consistency: string;
  durability: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpointSpec {
  id: string;
  method: HttpMethod;
  path: string;
  description: string;
  request: string;
  response: string;
}

export interface DesignNotes {
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirements;
  apiEndpoints: ApiEndpointSpec[];
  dataModel: string;
  tradeOffs: string;
}

export type DataFieldType =
  | 'uuid'
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'timestamp'
  | 'json';

export interface DataModelField {
  id: string;
  name: string;
  dataType: DataFieldType;
  isPrimaryKey: boolean;
  isNullable: boolean;
}

export interface DataModelEntity {
  id: string;
  name: string;
  position: { x: number; y: number };
  fields: DataModelField[];
}

export type RelationCardinality = 'one-to-one' | 'one-to-many' | 'many-to-many';

export interface DataModelRelation {
  id: string;
  source: string;
  target: string;
  cardinality: RelationCardinality;
  selected?: boolean;
}

export interface DataModelDiagram {
  entities: DataModelEntity[];
  relations: DataModelRelation[];
}

export interface DesignState {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  notes?: DesignNotes;
  schema?: DataModelDiagram;
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
