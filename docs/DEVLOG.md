# System Design Simulator — Developer Log

What was built, how, and why.

---

## 1. Monorepo Structure

**What**: Single `npm workspaces` monorepo containing three packages:
```
system-design-simulator/
├── apps/
│   ├── web/          ← Vite + React + TypeScript (frontend)
│   └── server/       ← Express + Socket.io (backend)
└── packages/
    └── shared/       ← TypeScript types shared by both sides
```

**How**: Root `package.json` declares `"workspaces": ["apps/*", "packages/*"]`. npm installs all three into a single `node_modules` hoisted at the root. The `shared` package is referenced in both `web` and `server` via `"@sds/shared": "*"` so a single `npm install` wires it all together without publishing to npm or symlink dance.

**Why monorepo**: The canvas (frontend) and the real-time room layer (backend) need to share the exact same TypeScript types (`ComponentSpec`, `EdgeSpec`, `SessionEvent`). If they were separate repos, those types would drift or require a publish cycle. Putting them in `packages/shared` means both sides import from the same source-of-truth at compile time. Any type mismatch between a Socket.io event emitter and its listener is caught by `tsc` before runtime.

**Why `concurrently`**: The root `npm run dev` script runs both `vite` and `tsx watch` in one terminal via `concurrently`. This is simpler than maintaining two terminal windows during development.

---

## 2. Frontend: Vite + React 19 + TypeScript

**What**: `apps/web` is a Vite SPA using React 19, TypeScript ~6, and `@vitejs/plugin-react`.

**Why Vite over CRA/Next.js**:
- CRA is unmaintained.
- Next.js adds SSR/routing overhead we don't need — this is a pure client-side canvas tool.
- Vite gives sub-second HMR, native ESM in dev, and a minimal config surface.

**Why React 19**: Latest stable. No breaking changes for our use case; `useCallback`, `useState` behave identically.

**Linter — oxlint**: We use `oxlint` instead of ESLint. It's written in Rust, runs ~50-100x faster, and covers the rules we care about (no-unused-vars, hooks rules) without a plugin ecosystem to maintain.

---

## 3. Canvas: @xyflow/react (ReactFlow v12)

**What**: The main design surface — drag nodes, draw edges, pan/zoom — is powered by `@xyflow/react`.

**Why ReactFlow over alternatives**:
- **Cytoscape.js** — powerful but not React-first; requires an imperative ref-based API that fights with React state.
- **D3** — too low-level; we'd rebuild pan/zoom, handles, edge routing from scratch.
- **ReactFlow** — purpose-built for node-edge graphs in React. Handles drag, resize, edge drawing, minimap, controls, and custom node types out of the box. The `@xyflow/react` v12 API is fully typed and integrates cleanly with Zustand.

**Custom node types**: Each of the 11 system design component types (Client, API Gateway, Load Balancer, Web Server, SQL DB, NoSQL DB, Cache, Message Queue, CDN, Storage, DNS) is a dedicated React component in `components/canvas/nodes/index.tsx`. They all share a `NodeBase` helper that renders the emoji + label + border ring. ReactFlow maps `node.type → nodeTypes[type]` at render time, so adding a new component type is just adding one export and one entry in the `nodeTypes` map.

---

## 4. State Management: Zustand

**What**: All frontend state lives in a single Zustand store at `store/useDesignStore.ts`.

```
components: ComponentSpec[]   ← nodes on the canvas
edges: EdgeSpec[]             ← connections between nodes
selectedId: string | null     ← which node the config panel shows
```

**Why Zustand over Redux / Context**:
- **Redux** — fine for large apps but requires actions, reducers, selectors boilerplate. We have one store with ~6 mutations; Redux overhead is not justified.
- **React Context** — every consumer re-renders on any state change. With potentially hundreds of nodes, this would cause the whole canvas to re-render on every drag tick.
- **Zustand** — minimal API (a single `create()` call), components subscribe to only the slices they use (so `ConfigPanel` doesn't re-render when a node is dragged), and it holds a stable function reference for `set`/`get` across renders.

**ReactFlow integration**: Zustand holds `components` (the ReactFlow nodes array) and `edges`. The store exposes `onNodesChange`, `onEdgesChange`, `onConnect` which are the exact callback signatures ReactFlow expects. When ReactFlow computes a drag delta it calls `onNodesChange` which calls `applyNodeChanges` (from `@xyflow/react`) to produce the new `components` array. This keeps ReactFlow's internal diff logic intact while the canonical state stays in Zustand.

---

## 5. Shared Types: `packages/shared`

**What**: A plain TypeScript package (no build step required — both `web` and `server` import directly from `src/index.ts`) exporting:

| Type | Purpose |
|---|---|
| `ComponentKind` | Union of the 11 valid node type strings |
| `ComponentSpec` | Full node: id, kind, label, position, config |
| `ComponentConfig` | replicas, readThroughput, writeThroughput, latencySlaMs |
| `EdgeSpec` | id, source, target |
| `DesignState` | { components, edges } — the full canvas snapshot |
| `SessionEvent` | Socket.io event envelope: type + payload + userId + timestamp |
| `ComponentMetrics` | Per-node runtime metrics (for Phase 1 simulation) |

**Why no build step for shared**: Both consumers import as `@sds/shared/src/index`, which resolves to the TypeScript source. Both consumers already run `tsc`, so there's no need for an extra compilation step in `shared` itself during development. This simplifies the monorepo — no `build:shared` step to run before `dev`.

---

## 6. Backend: Express + Socket.io

**What**: `apps/server` is a Node.js HTTP + WebSocket server.

```
src/
├── index.ts          ← Express app, http.Server, Socket.io init
└── rooms/
    └── roomHandlers.ts  ← all Socket.io room logic
```

**Why Express + Socket.io (not a pure WS server)**:
- Express handles the `/health` endpoint and will later serve REST routes (save/load designs, problem library).
- Socket.io gives room management (`socket.join(roomId)`) for free — broadcasting to everyone in a room is `io.to(roomId).emit(...)` vs hand-rolling participant maps over raw WebSockets.
- Socket.io also handles reconnect logic, transport fallback (polling → WebSocket), and heartbeats without additional code.

**Room state (in-memory)**: `roomState = Map<string, DesignState>` stores the current canvas state per room. When a new client joins, it receives the current `DesignState` immediately (`room:state` event) so it renders the existing design. This is a simple catch-up mechanism sufficient for Phase 0.

**Why in-memory and not a database**: Phase 0 goal is a runnable real-time skeleton. Adding a DB (Redis / Postgres) at this stage would require infra setup, migrations, and connection pooling before we've even validated the UX. The trade-off: server restart loses all sessions — acceptable until Phase 2.

**`tsx watch`**: The server runs with `tsx watch src/index.ts` instead of `ts-node` + `nodemon`. `tsx` uses esbuild to transpile TypeScript on the fly, making restarts near-instant. No `tsconfig` path aliases needed; it just works.

---

## 7. UI Layout (App.tsx)

**What**: Three-panel layout:
```
┌─────────────────────────────────────────────────────┐
│ Header: title + Clear button                         │
├─────────────┬───────────────────────────┬────────────┤
│ Component   │     ReactFlow Canvas      │  Config    │
│ Palette     │  (pan, zoom, drag, wire)  │  Panel     │
│ (200px)     │     (flex: 1)             │  (240px)   │
└─────────────┴───────────────────────────┴────────────┘
```

**ComponentPalette** (`components/sidebar/ComponentPalette.tsx`): Vertical list of all 11 component types. Clicking one calls `addComponent` in the Zustand store with a random offset from canvas center so components don't stack on top of each other.

**ConfigPanel** (`components/config/ConfigPanel.tsx`): Reads `selectedId` from Zustand. If nothing is selected, shows a placeholder. If a component is selected, renders 4 number inputs (replicas, read throughput, write throughput, latency SLA) that call `updateComponent` on change.

**Why inline styles over CSS modules / Tailwind**: 
- Tailwind requires a PostCSS build step and a config file; too much setup overhead for Phase 0.
- CSS modules require a separate `.module.css` file per component; fine at scale but adds file noise when the whole UI is a skeleton.
- Inline styles are co-located with the JSX, need no tooling, and are easy to refactor. We'll migrate to a design system (Radix + Tailwind) in Phase 1 when the layout stabilizes.

---

## 8. What Phase 0 Leaves Out (intentionally)

| Missing | Why deferred |
|---|---|
| Auth / user accounts | Not needed until Phase 2 (collaboration). No sensitive data in Phase 0. |
| Database persistence | In-memory store is fine until we validate the UX and need sessions to survive restart. |
| Tests | UI shape is still changing; snapshot tests would need constant updating. Unit tests will be added when the simulation engine (Phase 1) has stable logic worth testing. |
| Error boundaries | Canvas won't crash from user actions; deferred until real data entry exists. |
| Accessibility (ARIA) | Palette buttons have `title` attributes. Full ARIA roles deferred to Phase 1. |
| Production build / CI | No deployment target yet. CI pipeline added in Phase 2 alongside the collaboration feature. |

---

## Current File Map

```
apps/web/src/
├── App.tsx                          ← root layout, header, panel wiring
├── index.css                        ← global reset
├── main.tsx                         ← React root mount
├── store/
│   └── useDesignStore.ts            ← Zustand store (nodes, edges, selection)
└── components/
    ├── canvas/
    │   ├── DesignCanvas.tsx         ← ReactFlow wrapper
    │   └── nodes/
    │       └── index.tsx            ← 11 custom node components
    ├── config/
    │   └── ConfigPanel.tsx          ← right-panel: edit selected node
    └── sidebar/
        └── ComponentPalette.tsx     ← left-panel: click to add nodes

apps/server/src/
├── index.ts                         ← Express + Socket.io bootstrap
└── rooms/
    └── roomHandlers.ts              ← room:join, room:leave, session:event

packages/shared/src/
└── index.ts                         ← ComponentKind, ComponentSpec, EdgeSpec,
                                        DesignState, SessionEvent, ComponentMetrics
```

---

## 9. Bug Fixes — 2026-07-26

### Fix 1: Canvas height not resolving (ReactFlow nodes invisible)

**File**: [`apps/web/src/App.tsx`](../apps/web/src/App.tsx) — `<main>` element (line 206)

**Symptom**: ReactFlow rendered an empty canvas; nodes added via the palette were not visible.

**Root cause**: The `<main>` wrapper around `<DesignCanvas>` had no explicit height. ReactFlow's internal container uses `height: 100%` to size itself, but percentage heights require an ancestor with a resolved pixel height. Without `height: '100%'` on `<main>`, the container resolved to 0 px and ReactFlow rendered nothing.

**Fix**: Added `height: '100%'` and `overflow: 'hidden'` to the `<main>` element's inline style:

```tsx
<main style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
  <DesignCanvas />
</main>
```

**Why `overflow: 'hidden'`**: Prevents the ReactFlow viewport from creating scrollbars on the outer layout when nodes are dragged near the edge.

---

### Fix 2: Bottleneck threshold too aggressive (false positives at 80% utilization)

**File**: [`apps/web/src/simulation/simulationWorker.ts`](../apps/web/src/simulation/simulationWorker.ts) — lines 92, 122, 129

**Symptom**: Nodes were flagged as bottlenecks and shown in red even when handling only 80% of their configured capacity — well within normal operating range.

**Root cause**: Both the running-simulation queuing penalty (line 92) and the per-node bottleneck detection (lines 122/129) used `utilization > 0.8` as their threshold. This caused nodes to be visually highlighted as overloaded before they were actually saturated, and the two code paths used inconsistent thresholds.

**Fix**:

| Location | Before | After |
|---|---|---|
| Queuing multiplier — simulate() (line 92) | `utilization > 0.8 ? 1 + (utilization - 0.8) * 10` | `utilization >= 1.0 ? 1 + (utilization - 1.0) * 10` |
| `isBottleneck` flag (line 122) | `utilization > 0.8` | `utilization >= 1.0` |
| Queuing multiplier — metrics (line 129) | `utilization > 0.8 ? 1 + (utilization - 0.8) * 10` | `utilization >= 1.0 ? 1 + (utilization - 1.0) * 10` |

**Why `>= 1.0`**: A node is only a bottleneck when incoming QPS meets or exceeds its total capacity (`replicas × readThroughput`). At sub-100% utilization the node has headroom. Aligning both code paths to the same threshold eliminates the false-positive highlights and ensures p99 latency inflation in the simulation matches what the metrics panel reports.

---

### Fix 3: React StrictMode causes duplicate nodes from localStorage restore

**File**: [`apps/web/src/App.tsx`](../apps/web/src/App.tsx) — localStorage restore `useEffect`

**Symptom**: After a page reload, each saved node appeared twice in the Zustand store (same ID, overlapping on the canvas). The metrics panel showed duplicate component rows.

**Root cause**: React 18 StrictMode intentionally double-invokes effects in development. The restore `useEffect` had no guard against re-execution, so `addComponent` was called twice for every saved node.

**Fix**: Added a `hasRestoredRef` (`useRef(false)`) that is set to `true` on the first invocation. The second StrictMode invocation sees `hasRestoredRef.current === true` and returns early.

```tsx
const hasRestoredRef = useRef(false);
useEffect(() => {
  if (hasRestoredRef.current) return;
  hasRestoredRef.current = true;
  const saved = loadDesign();
  if (saved && saved.components.length > 0) {
    clearCanvas();
    for (const c of saved.components) addComponent(c, true);
  }
}, []);
```

---

### Fix 4: React StrictMode causes `room:join` to fire twice

**File**: [`apps/web/src/App.tsx`](../apps/web/src/App.tsx) — room join `useEffect`

**Symptom**: Server logs showed `room:join received` twice per page load from the same socket ID. The server sent two `room:state` events back, causing double state hydration in the store.

**Root cause**: The original guard used a local `let joined = false` variable inside the effect. StrictMode tears down and re-mounts the effect, creating a new closure with `joined = false`, so the second invocation bypassed the guard.

**Fix**: Replaced the local variable with a `hasJoinedRef` (`useRef(false)`) that persists across StrictMode re-mounts:

```tsx
const hasJoinedRef = useRef(false);
useEffect(() => {
  if (hasJoinedRef.current) return;
  function doJoin() {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    socket.emit('room:join', 'default-room');
  }
  if (socket.connected) doJoin();
  else socket.once('connect', doJoin);
  return () => { socket.off('connect', doJoin); };
}, []);
```
