/// <reference lib="webworker" />
import type { ComponentSpec, EdgeSpec, ComponentMetrics, MetricsSnapshot } from '@sds/shared/src/index';

export interface SimulationInput {
  components: ComponentSpec[];
  edges: EdgeSpec[];
  ingressQps: number;
}

// ── Topological sort (Kahn's algorithm) ──────────────────────────────────────
function topoSort(components: ComponentSpec[], edges: EdgeSpec[]): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const c of components) {
    inDegree.set(c.id, 0);
    adj.set(c.id, []);
  }
  for (const e of edges) {
    adj.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If cycle detected (order.length < components.length), return partial
  return order;
}

// ── Core simulation ───────────────────────────────────────────────────────────
function simulate(input: SimulationInput): MetricsSnapshot {
  const { components, edges, ingressQps } = input;

  if (components.length === 0) {
    return { timestamp: Date.now(), components: [], totalQps: 0, totalP99LatencyMs: 0 };
  }

  const order = topoSort(components, edges);
  const compMap = new Map(components.map((c) => [c.id, c]));

  // qps flowing into each node
  const qpsAt = new Map<string, number>();
  // accumulated latency (critical path ms) to each node
  const latencyAt = new Map<string, number>();

  // Build reverse adjacency: who sends to me?
  const parents = new Map<string, string[]>();
  for (const c of components) parents.set(c.id, []);
  for (const e of edges) parents.get(e.target)?.push(e.source);

  for (const id of order) {
    const comp = compMap.get(id);
    if (!comp) continue;

    const myParents = parents.get(id) ?? [];
    let inQps: number;
    let pathLatency: number;

    if (myParents.length === 0) {
      // Entry point — receives full ingress load
      inQps = ingressQps;
      pathLatency = 0;
    } else {
      // Sum QPS from parents; take max latency path
      inQps = myParents.reduce((sum, pid) => sum + (qpsAt.get(pid) ?? 0), 0);
      pathLatency = Math.max(...myParents.map((pid) => latencyAt.get(pid) ?? 0));
    }

    // Each component distributes evenly across replicas
    const replicas = Math.max(1, comp.config.replicas);
    const qpsPerReplica = inQps / replicas;

    // Capacity = readThroughput per replica
    const capacity = comp.config.readThroughput * replicas;

    // Base latency = latencySlaMs; queuing penalty only when node is saturated (>= 100% capacity)
    const utilization = capacity > 0 ? inQps / capacity : 1;
    const queuingMultiplier = utilization >= 1.0 ? 1 + (utilization - 1.0) * 10 : 1;
    const hopLatency = comp.config.latencySlaMs * queuingMultiplier;

    qpsAt.set(id, inQps);
    latencyAt.set(id, pathLatency + hopLatency);

    // Suppress unused-var warning — qpsPerReplica used implicitly in utilization
    void qpsPerReplica;
  }

  // Find max latency node as bottleneck
  let maxLatency = 0;
  for (const v of latencyAt.values()) {
    if (v > maxLatency) maxLatency = v;
  }

  // Find SPOF: nodes with in-degree > 0 AND out-degree > 0 AND replicas === 1
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();
  for (const c of components) { outDegree.set(c.id, 0); inDegree.set(c.id, 0); }
  for (const e of edges) {
    outDegree.set(e.source, (outDegree.get(e.source) ?? 0) + 1);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const metricsComponents: ComponentMetrics[] = components.map((c) => {
    const qps = qpsAt.get(c.id) ?? 0;
    const capacity = c.config.readThroughput * Math.max(1, c.config.replicas);
    const utilization = capacity > 0 ? qps / capacity : 0;
    // A node is a bottleneck only if its incoming QPS exceeds its own capacity
    const isBottleneck = utilization >= 1.0;
    const isSPOF =
      c.config.replicas === 1 &&
      (inDegree.get(c.id) ?? 0) > 0 &&
      (outDegree.get(c.id) ?? 0) > 0;

    // p50 ≈ latencySla, p99 ≈ latencySla * queuingMultiplier (already in totalLatency relative hop)
    const queuingMultiplier = utilization >= 1.0 ? 1 + (utilization - 1.0) * 10 : 1;
    return {
      componentId: c.id,
      qps,
      p50LatencyMs: c.config.latencySlaMs,
      p99LatencyMs: c.config.latencySlaMs * queuingMultiplier,
      isBottleneck,
      isSinglePointOfFailure: isSPOF,
    };
  });

  const totalP99 = Math.max(...metricsComponents.map((m) => m.p99LatencyMs), 0);

  return {
    timestamp: Date.now(),
    components: metricsComponents,
    totalQps: ingressQps,
    totalP99LatencyMs: totalP99,
  };
}

// ── Worker message loop ───────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent<SimulationInput>) => {
  const { components, edges, ingressQps } = e.data;
  console.log('[SDS:sim] Simulation started', { nodeCount: components.length, edgeCount: edges.length, ingressQps });
  try {
    const result = simulate(e.data);
    const bottlenecks = result.components.filter((c) => c.isBottleneck).length;
    const spofs = result.components.filter((c) => c.isSinglePointOfFailure).length;
    console.log('[SDS:sim] Simulation completed', { bottlenecks, spofs, totalP99LatencyMs: result.totalP99LatencyMs });
    self.postMessage(result);
  } catch (err) {
    console.log('[SDS:sim] Simulation error', { error: String(err) });
    throw err;
  }
};