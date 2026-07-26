import type { ComponentSpec, EdgeSpec } from '@sds/shared/src/index';

export interface SeedProblem {
  id: string;
  title: string;
  description: string;
  targetQps: number;
  components: ComponentSpec[];
  edges: EdgeSpec[];
}

const p = (id: string, kind: ComponentSpec['kind'], label: string, x: number, y: number, config: ComponentSpec['config']): ComponentSpec => ({
  id, kind, label, position: { x, y }, config,
});

const e = (source: string, target: string): EdgeSpec => ({
  id: `e-${source}-${target}`, source, target,
});

export const SEED_PROBLEMS: SeedProblem[] = [
  // ── 1. URL Shortener ────────────────────────────────────────────────────────
  {
    id: 'url-shortener',
    title: 'URL Shortener',
    description:
      'Design a system like bit.ly. Handle 10K writes/sec (new short URLs) and 100K reads/sec (redirects). P99 redirect latency < 20ms.',
    targetQps: 100_000,
    components: [
      p('c1', 'client',       'Client',       50,  200, { replicas: 1,  readThroughput: 100_000, writeThroughput: 10_000, latencySlaMs: 1  }),
      p('c2', 'dns',          'DNS',          200, 200, { replicas: 2,  readThroughput: 200_000, writeThroughput: 1_000,  latencySlaMs: 2  }),
      p('c3', 'load-balancer','Load Balancer',380, 200, { replicas: 2,  readThroughput: 200_000, writeThroughput: 200_000,latencySlaMs: 1  }),
      p('c4', 'web-server',   'API Server',   560, 120, { replicas: 4,  readThroughput: 30_000,  writeThroughput: 5_000,  latencySlaMs: 5  }),
      p('c5', 'cache',        'Redis Cache',  750, 120, { replicas: 2,  readThroughput: 80_000,  writeThroughput: 10_000, latencySlaMs: 1  }),
      p('c6', 'database-sql', 'MySQL (URLs)', 750, 300, { replicas: 1,  readThroughput: 5_000,   writeThroughput: 2_000,  latencySlaMs: 10 }),
    ],
    edges: [
      e('c1','c2'), e('c2','c3'), e('c3','c4'), e('c4','c5'), e('c4','c6'),
    ],
  },

  // ── 2. Twitter Feed ─────────────────────────────────────────────────────────
  {
    id: 'twitter-feed',
    title: 'Twitter / Social Feed',
    description:
      'Design a home timeline feature for 50M DAU. Reads dominate: 500K reads/sec vs 5K writes/sec. Tolerate eventual consistency for feed freshness.',
    targetQps: 500_000,
    components: [
      p('t1', 'client',         'Mobile / Web',   50,  250, { replicas: 1,   readThroughput: 500_000, writeThroughput: 5_000,  latencySlaMs: 1  }),
      p('t2', 'cdn',            'CDN (Media)',     50,  80,  { replicas: 3,   readThroughput: 600_000, writeThroughput: 10_000, latencySlaMs: 5  }),
      p('t3', 'api-gateway',    'API Gateway',     260, 250, { replicas: 4,   readThroughput: 200_000, writeThroughput: 10_000, latencySlaMs: 2  }),
      p('t4', 'load-balancer',  'LB (Feed)',       450, 250, { replicas: 2,   readThroughput: 400_000, writeThroughput: 10_000, latencySlaMs: 1  }),
      p('t5', 'web-server',     'Feed Service',    640, 180, { replicas: 8,   readThroughput: 80_000,  writeThroughput: 2_000,  latencySlaMs: 10 }),
      p('t6', 'cache',          'Feed Cache',      840, 120, { replicas: 4,   readThroughput: 200_000, writeThroughput: 20_000, latencySlaMs: 2  }),
      p('t7', 'database-nosql', 'Cassandra',       840, 300, { replicas: 6,   readThroughput: 40_000,  writeThroughput: 8_000,  latencySlaMs: 15 }),
      p('t8', 'message-queue',  'Kafka (fanout)',  640, 350, { replicas: 3,   readThroughput: 50_000,  writeThroughput: 10_000, latencySlaMs: 5  }),
    ],
    edges: [
      e('t1','t2'), e('t1','t3'), e('t3','t4'), e('t4','t5'),
      e('t5','t6'), e('t5','t7'), e('t5','t8'),
    ],
  },

  // ── 3. Rate Limiter ─────────────────────────────────────────────────────────
  {
    id: 'rate-limiter',
    title: 'Distributed Rate Limiter',
    description:
      'Design a rate-limiting service that enforces per-user API quotas across 20 globally distributed API servers. Target: 200K req/sec with < 5ms added latency.',
    targetQps: 200_000,
    components: [
      p('r1', 'client',      'API Clients',    50,  200, { replicas: 1, readThroughput: 200_000, writeThroughput: 200_000, latencySlaMs: 1  }),
      p('r2', 'api-gateway', 'API Gateway',    260, 200, { replicas: 4, readThroughput: 100_000, writeThroughput: 100_000, latencySlaMs: 2  }),
      p('r3', 'cache',       'Redis (tokens)', 460, 120, { replicas: 3, readThroughput: 300_000, writeThroughput: 300_000, latencySlaMs: 1  }),
      p('r4', 'web-server',  'Rate Svc',       460, 300, { replicas: 6, readThroughput: 50_000,  writeThroughput: 50_000,  latencySlaMs: 2  }),
      p('r5', 'database-sql','Config DB',      660, 300, { replicas: 2, readThroughput: 10_000,  writeThroughput: 1_000,   latencySlaMs: 10 }),
    ],
    edges: [
      e('r1','r2'), e('r2','r3'), e('r2','r4'), e('r4','r5'),
    ],
  },

  // ── 4. File Upload System ───────────────────────────────────────────────────
  {
    id: 'file-upload',
    title: 'File Upload System',
    description:
      'Design a large-file upload pipeline (like Google Drive). Support 10K concurrent uploads, each up to 5GB. Decouple upload from processing using async queues.',
    targetQps: 10_000,
    components: [
      p('f1', 'client',         'Upload Client',  50,  230, { replicas: 1, readThroughput: 10_000, writeThroughput: 10_000, latencySlaMs: 5   }),
      p('f2', 'load-balancer',  'Upload LB',      250, 230, { replicas: 2, readThroughput: 20_000, writeThroughput: 20_000, latencySlaMs: 1   }),
      p('f3', 'web-server',     'Upload API',     450, 230, { replicas: 4, readThroughput: 5_000,  writeThroughput: 5_000,  latencySlaMs: 10  }),
      p('f4', 'storage',        'Object Store',   660, 130, { replicas: 3, readThroughput: 20_000, writeThroughput: 15_000, latencySlaMs: 50  }),
      p('f5', 'message-queue',  'Job Queue',      660, 330, { replicas: 2, readThroughput: 15_000, writeThroughput: 10_000, latencySlaMs: 5   }),
      p('f6', 'web-server',     'Worker Pool',    860, 330, { replicas: 8, readThroughput: 2_000,  writeThroughput: 2_000,  latencySlaMs: 500 }),
      p('f7', 'database-sql',   'Metadata DB',    860, 130, { replicas: 2, readThroughput: 5_000,  writeThroughput: 3_000,  latencySlaMs: 10  }),
    ],
    edges: [
      e('f1','f2'), e('f2','f3'), e('f3','f4'), e('f3','f5'),
      e('f5','f6'), e('f6','f7'), e('f4','f7'),
    ],
  },

  // ── 5. Notification Service ─────────────────────────────────────────────────
  {
    id: 'notification-service',
    title: 'Notification Service',
    description:
      'Design a push/email/SMS notification system that sends 1M notifications/min across 3 channels. Guarantee at-least-once delivery with deduplication.',
    targetQps: 16_667,
    components: [
      p('n1', 'api-gateway',    'Trigger API',    50,  230, { replicas: 2, readThroughput: 20_000, writeThroughput: 20_000, latencySlaMs: 5  }),
      p('n2', 'message-queue',  'Kafka (events)', 260, 230, { replicas: 3, readThroughput: 50_000, writeThroughput: 20_000, latencySlaMs: 3  }),
      p('n3', 'web-server',     'Dispatch Workers',460,150, { replicas: 6, readThroughput: 10_000, writeThroughput: 10_000, latencySlaMs: 20 }),
      p('n4', 'cache',          'Dedup Cache',    660, 80,  { replicas: 2, readThroughput: 80_000, writeThroughput: 20_000, latencySlaMs: 1  }),
      p('n5', 'database-nosql', 'Delivery Log',   660, 230, { replicas: 3, readThroughput: 15_000, writeThroughput: 10_000, latencySlaMs: 8  }),
      p('n6', 'web-server',     'Channel Adapters',860,150,{ replicas: 4, readThroughput: 8_000,  writeThroughput: 8_000,  latencySlaMs: 50 }),
    ],
    edges: [
      e('n1','n2'), e('n2','n3'), e('n3','n4'), e('n3','n5'), e('n3','n6'),
    ],
  },
];