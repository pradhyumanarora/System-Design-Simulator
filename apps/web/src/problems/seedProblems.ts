import type {
  ApiEndpointSpec,
  ComponentSpec,
  DesignNotes,
  EdgeSpec,
  NonFunctionalRequirements,
} from '@sds/shared/src/index';

export interface SeedProblem {
  id: string;
  title: string;
  description: string;
  targetQps: number;
  components: ComponentSpec[];
  edges: EdgeSpec[];
  notes: DesignNotes;
}

const p = (id: string, kind: ComponentSpec['kind'], label: string, x: number, y: number, config: ComponentSpec['config']): ComponentSpec => ({
  id, kind, label, position: { x, y }, config,
});

const e = (source: string, target: string): EdgeSpec => ({
  id: `e-${source}-${target}`, source, target,
});

const notes = (
  prefix: string,
  requirements: string[],
  nfr: NonFunctionalRequirements,
  apiEndpoints: Array<Omit<ApiEndpointSpec, 'id'>>,
  dataModel: string,
  tradeOffs: string,
): DesignNotes => ({
  functionalRequirements: requirements.map((text, index) => ({
    id: `${prefix}-fr-${index + 1}`,
    text,
    completed: false,
  })),
  nonFunctionalRequirements: nfr,
  apiEndpoints: apiEndpoints.map((endpoint, index) => ({
    ...endpoint,
    id: `${prefix}-api-${index + 1}`,
  })),
  dataModel,
  tradeOffs,
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
    notes: notes(
      'url',
      ['Create a short URL for a valid long URL', 'Redirect a short code to its original URL'],
      {
        availability: '99.99% for redirects',
        latency: 'p99 redirect latency below 20 ms',
        scale: '100K reads/sec and 10K writes/sec',
        consistency: 'Strong consistency for creation; eventual consistency is acceptable for analytics',
        durability: 'Short-link mappings must not be lost',
      },
      [
        {
          method: 'POST',
          path: '/v1/urls',
          description: 'Create a short URL',
          request: '{ "longUrl": "https://example.com/page" }',
          response: '{ "shortCode": "aB3x9" }',
        },
        {
          method: 'GET',
          path: '/:shortCode',
          description: 'Redirect to the original URL',
          request: '',
          response: 'HTTP 302 Location: https://example.com/page',
        },
      ],
      'UrlMapping(shortCode PK, longUrl, userId, createdAt, expiresAt)\nIndex by userId for listing links.',
      'A random code avoids sequence leakage but requires collision checks. Cache hot redirects while keeping the database authoritative.',
    ),
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
    notes: notes(
      'feed',
      ['Publish a post', 'Read a personalized home timeline', 'Follow or unfollow another user'],
      {
        availability: '99.99% for timeline reads',
        latency: 'p99 feed reads below 200 ms',
        scale: '500K reads/sec, 5K writes/sec and 50M daily users',
        consistency: 'Eventual consistency for feed freshness',
        durability: 'Published posts must be durable',
      },
      [
        {
          method: 'POST',
          path: '/v1/posts',
          description: 'Publish a post',
          request: '{ "text": "hello" }',
          response: '{ "postId": "p123" }',
        },
        {
          method: 'GET',
          path: '/v1/feed?cursor=...',
          description: 'Fetch a paginated home timeline',
          request: '',
          response: '{ "items": [], "nextCursor": "..." }',
        },
      ],
      'Post(postId PK, authorId, body, createdAt)\nFollow(followerId, followeeId)\nFeedEntry(userId partition key, createdAt sort key, postId)',
      'Fan-out on write makes reads fast but is expensive for celebrity accounts; use a hybrid fan-out strategy.',
    ),
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
    notes: notes(
      'rate',
      ['Check whether a request is allowed', 'Configure quotas by client and API'],
      {
        availability: 'Fail open or fail closed must be configurable',
        latency: 'Add less than 5 ms to each request',
        scale: '200K checks/sec across 20 regions',
        consistency: 'Small temporary quota drift is acceptable',
        durability: 'Configuration must be durable; counters may be ephemeral',
      },
      [{
        method: 'POST',
        path: '/v1/check',
        description: 'Consume quota for a request',
        request: '{ "clientId": "c1", "resource": "/search" }',
        response: '{ "allowed": true, "remaining": 42 }',
      }],
      'RateLimitPolicy(clientId, resource, limit, window)\nCounter key: clientId:resource:window with atomic increment and TTL.',
      'Token bucket supports bursts; a fixed window is simpler but creates boundary spikes. Regional counters trade exactness for latency.',
    ),
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
    notes: notes(
      'upload',
      ['Start a resumable upload', 'Upload file parts', 'Track processing status', 'Download a completed file'],
      {
        availability: 'Uploads must resume after client or server failures',
        latency: 'Metadata operations below 200 ms',
        scale: '10K concurrent uploads with files up to 5 GB',
        consistency: 'Strong consistency for upload completion metadata',
        durability: 'Uploaded objects require multi-zone durability',
      },
      [{
        method: 'POST',
        path: '/v1/uploads',
        description: 'Start a multipart upload',
        request: '{ "name": "video.mp4", "size": 5368709120 }',
        response: '{ "uploadId": "u123", "partUrls": [] }',
      }],
      'File(fileId PK, ownerId, objectKey, status, size, checksum)\nUploadPart(uploadId, partNumber, checksum, status)',
      'Direct-to-object-storage uploads reduce API load. Multipart uploads add cleanup complexity for abandoned sessions.',
    ),
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
    notes: notes(
      'notify',
      ['Submit a notification', 'Deliver through email, SMS or push', 'Track delivery status', 'Deduplicate retries'],
      {
        availability: 'Accept notification requests during downstream provider outages',
        latency: 'Queue requests within 100 ms',
        scale: 'One million notifications per minute',
        consistency: 'At-least-once delivery with idempotent consumers',
        durability: 'Queued notifications and delivery status must survive failures',
      },
      [{
        method: 'POST',
        path: '/v1/notifications',
        description: 'Queue a notification',
        request: '{ "userId": "u1", "channel": "push", "templateId": "welcome" }',
        response: '{ "notificationId": "n123", "status": "queued" }',
      }],
      'Notification(id PK, userId, channel, payload, status, idempotencyKey)\nDeliveryAttempt(notificationId, provider, attempt, result, createdAt)',
      'At-least-once delivery is practical but requires idempotency. Provider failover improves availability but may increase cost.',
    ),
  },
];