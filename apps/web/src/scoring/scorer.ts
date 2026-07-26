import type { ComponentSpec, EdgeSpec, MetricsSnapshot } from '@sds/shared/src/index';

export interface ScoreResult {
  total: number;       // 0–100
  breakdown: {
    label: string;
    score: number;     // 0–points
    maxScore: number;
    passed: boolean;
    comment: string;
  }[];
}

/**
 * Basic scoring rubric (Phase 1):
 *  1. Handles target QPS without bottleneck  — 30 pts
 *  2. No single-point-of-failure             — 25 pts
 *  3. Has caching layer                      — 15 pts
 *  4. Has load balancer                      — 15 pts
 *  5. p99 latency < 200ms                    — 15 pts
 */
export function scoreDesign(
  components: ComponentSpec[],
  edges: EdgeSpec[],
  metrics: MetricsSnapshot | null,
  targetQps: number,
): ScoreResult {
  void edges; // reserved for future path-completeness check

  const kinds = new Set(components.map((c) => c.kind));

  // 1. QPS / bottleneck check
  const bottleneckCount = metrics?.components.filter((m) => m.isBottleneck).length ?? 0;
  const totalCapacity = components.reduce(
    (sum, c) => sum + c.config.readThroughput * Math.max(1, c.config.replicas),
    0,
  );
  const qpsHandled = totalCapacity >= targetQps && bottleneckCount === 0;
  const qpsScore = qpsHandled ? 30 : bottleneckCount === 0 ? 15 : 0;

  // 2. No SPOF
  const spofCount = metrics?.components.filter((m) => m.isSinglePointOfFailure).length ?? 0;
  const noSpof = spofCount === 0;
  const spofScore = noSpof ? 25 : spofCount === 1 ? 10 : 0;

  // 3. Caching layer present
  const hasCache = kinds.has('cache');
  const cacheScore = hasCache ? 15 : 0;

  // 4. Load balancer present
  const hasLb = kinds.has('load-balancer');
  const lbScore = hasLb ? 15 : 0;

  // 5. p99 latency
  const p99 = metrics?.totalP99LatencyMs ?? Infinity;
  const latencyScore = p99 < 100 ? 15 : p99 < 200 ? 10 : p99 < 500 ? 5 : 0;

  const breakdown = [
    {
      label: 'Handles target QPS',
      score: qpsScore,
      maxScore: 30,
      passed: qpsHandled,
      comment: qpsHandled
        ? `Design handles ${(targetQps / 1000).toFixed(0)}K QPS`
        : bottleneckCount > 0
          ? `${bottleneckCount} bottleneck(s) detected`
          : `Capacity (${(totalCapacity / 1000).toFixed(0)}K) below target (${(targetQps / 1000).toFixed(0)}K)`,
    },
    {
      label: 'No single points of failure',
      score: spofScore,
      maxScore: 25,
      passed: noSpof,
      comment: noSpof ? 'All critical nodes have replicas ≥ 2' : `${spofCount} SPOF(s) detected`,
    },
    {
      label: 'Caching layer present',
      score: cacheScore,
      maxScore: 15,
      passed: hasCache,
      comment: hasCache ? 'Cache node found' : 'Add a Cache (Redis/Memcached) node',
    },
    {
      label: 'Load balancer present',
      score: lbScore,
      maxScore: 15,
      passed: hasLb,
      comment: hasLb ? 'Load Balancer found' : 'Add a Load Balancer node',
    },
    {
      label: 'p99 latency < 200ms',
      score: latencyScore,
      maxScore: 15,
      passed: p99 < 200,
      comment:
        p99 === Infinity
          ? 'Run simulation first'
          : `System p99: ${p99.toFixed(0)}ms`,
    },
  ];

  const total = breakdown.reduce((s, b) => s + b.score, 0);
  return { total, breakdown };
}