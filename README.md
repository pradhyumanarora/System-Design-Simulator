# System Design Simulator

An interactive canvas for practising system design interviews — drag components onto a canvas, wire them together, run a traffic simulation, and score your design against a target QPS.

## Current Features (Phase 0 + Phase 1 complete)

| Feature | Status |
|---|---|
| **ReactFlow canvas** — drag, pan, zoom, connect 11 component types | ✅ |
| **Component palette** — Client, DNS, CDN, API Gateway, Load Balancer, Web Server, Cache, SQL DB, NoSQL DB, Message Queue, Storage | ✅ |
| **Config panel** — per-node replicas, read/write throughput, latency SLA | ✅ |
| **Traffic simulation** — Web Worker, topological sort, per-hop QPS + critical-path latency | ✅ |
| **Live metrics panel** — system QPS, p50/p99 latency, bottleneck & SPOF detection | ✅ |
| **5 seed problems** — URL Shortener, Twitter Feed, Rate Limiter, File Upload, Notification Service | ✅ |
| **Design Notes workspace** — requirements, NFRs, API design, data model and trade-offs | ✅ |
| **Design scoring** — QPS coverage, redundancy, bottleneck-free, SPOF-free checks | ✅ |
| **localStorage persistence** — auto-save/restore on every change | ✅ |
| **Export as PNG** | ✅ |
| **Real-time collaboration** — Socket.IO room sync (component add/update/remove, edge add) | ✅ (basic) |

## GitHub Pages

The frontend is deployed by `.github/workflows/deploy-pages.yml` whenever a
stable `v*` tag is pushed:

<https://pradhyumanarora.github.io/System-Design-Simulator/>

GitHub Pages hosts only the static UI. The canvas, simulation, scoring, Design
Notes and local persistence work without the server. Real-time collaboration is
disabled in this mode.

Regular development can continue on `master` without changing the deployed
site. Publish a new stable version by creating and pushing a version tag:

```bash
git tag -a v1.1.0 -m "v1.1.0"
git push origin v1.1.0
```

To enable collaboration in another production environment, deploy
`apps/server` separately and build the frontend with:

```bash
VITE_SERVER_URL=https://your-server.example.com npm run build --workspace=apps/web
```

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

## Local Development

```bash
# 1. Clone the repository
git clone https://github.com/pradhyumanarora/System-Design-Simulator.git
cd System-Design-Simulator

# 2. Install all dependencies (root + all workspaces)
npm install

# 3. Start both the web app and server concurrently
npm run dev
```

This starts:
- **Web app** (Vite + React) at `http://localhost:5173`
- **WebSocket server** (Node.js + Socket.IO) at `http://localhost:3001`

### Run individually

```bash
# Web frontend only
npm run dev --workspace=apps/web

# Backend server only
npm run dev --workspace=apps/server
```

### Build for production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
System-Design-Simulator/
├── apps/
│   ├── web/                        # React 19 + Vite + TypeScript frontend
│   │   └── src/
│   │       ├── App.tsx             # Root layout, header, panel wiring
│   │       ├── socket.ts           # Socket.IO client singleton
│   │       ├── store/
│   │       │   └── useDesignStore.ts   # Zustand store (nodes, edges, selection, collab)
│   │       ├── components/
│   │       │   ├── canvas/         # ReactFlow wrapper + 11 custom node types
│   │       │   ├── config/         # ConfigPanel (edit selected node)
│   │       │   ├── metrics/        # MetricsPanel (live simulation output)
│   │       │   ├── scoring/        # ScorePanel (modal score result)
│   │       │   └── sidebar/        # ComponentPalette (click to add nodes)
│   │       ├── simulation/
│   │       │   ├── simulationWorker.ts  # Web Worker — topo sort + QPS/latency engine
│   │       │   └── useSimulation.ts     # Hook that drives the worker
│   │       ├── problems/
│   │       │   └── seedProblems.ts      # 5 built-in design problems
│   │       ├── scoring/
│   │       │   └── scorer.ts            # Design scoring logic
│   │       └── persistence/
│   │           └── storage.ts           # localStorage save/load + PNG export
│   └── server/                     # Node.js + Express + Socket.IO backend
│       └── src/
│           ├── index.ts            # HTTP server bootstrap
│           └── rooms/
│               └── roomHandlers.ts # room:join, session:event, in-memory state
├── packages/
│   └── shared/                     # Shared TypeScript types (ComponentSpec, EdgeSpec, …)
└── package.json                    # npm workspaces root
```

## Debug Logging

The app emits structured debug logs to the browser console and server stdout, prefixed by context:

| Prefix | Source |
|---|---|
| `[SDS:store]` | Zustand store actions & remote events |
| `[SDS:server]` | Socket.IO room handlers |
| `[SDS:sim]` | Web Worker simulation engine |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
