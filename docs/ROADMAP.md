# System Design Simulator — Roadmap

**Audience**: Interview prep (FAANG) + distributed systems learning
**Differentiator**: Real-time collaborative design + structured interview mode
**Stack**: React + TypeScript + Vite (frontend), Node.js + Express + Socket.io (backend), ReactFlow (canvas)
**MVP target**: 2–4 weeks

---

## Phase 0 — Foundation ✅ Complete

Goal: Runnable skeleton with canvas + real-time infra

1. ✅ **Project scaffold** — React + TypeScript (Vite), Node.js + Express backend, monorepo (`apps/web`, `apps/server`)
2. ✅ **WebSocket layer** — Socket.io with room-based session management
3. ✅ **Canvas** — ReactFlow with drag, drop, connect nodes
4. ✅ **11 core components** — Client, API Gateway, Load Balancer, Web Server, SQL DB, NoSQL DB, Cache, Message Queue, CDN, Storage, DNS
5. ✅ **State management** — Zustand on frontend, in-memory session store on backend
6. ✅ **Component config panel** — click to configure replicas, read/write throughput, latency SLA

---

## Phase 1 — MVP ✅ Complete

Goal: Solo simulation works end-to-end

7. ✅ **Traffic simulation engine** — Web Worker, topological sort (Kahn's algorithm) → per-hop QPS propagation → critical-path latency accumulation
8. ✅ **Live metrics sidebar** — QPS, p50/p99 latency, bottleneck detection (≥100% utilization), single-point-of-failure highlighting
9. ✅ **5 seed design problems** — URL Shortener, Twitter Feed, Rate Limiter, File Upload System, Notification Service (loaded via "📋 Problems" menu)
10. ✅ **Design persistence** — auto-save/load JSON to localStorage; export as PNG
11. ✅ **Basic scoring** — completeness check: handles stated QPS? redundancy (replicas > 1)? no bottlenecks? no SPOFs?

---

## Phase 2 — Collaboration & Interview Mode (Month 2)

Goal: Realtime multiplayer + structured interview experience

12. **Room creation** — shareable session URL (host + guest(s)), real-time cursor sync, component lock-on-edit
13. **Chat / annotation panel** — inline text notes on components, shared whiteboard layer
14. **Interview Mode (timed)** — host picks a problem, 45-min timer starts, candidate designs while interviewer watches live
15. **Interviewer Panel** — checklist-based scoring rubric (scalability, reliability, trade-offs, API design, DB choice), private notes, final score + feedback delivery
16. **Session recording** — replay full design history as animated playback (Figma-style)

---

## Phase 3 — Learning Layer (Month 2–3)

Goal: Structured learning paths and failure education

17. **Problem library** — 30+ curated problems across Easy/Medium/Hard with reference architectures
18. **Guided mode** — step-by-step hints without spoilers, nudge at each design phase
19. **Trade-off Explorer** — side-by-side comparison cards (SQL vs NoSQL, sync vs async, push vs pull); selecting one updates component config
20. **Failure Injection mode** — click component → inject failure (latency spike, total crash, network partition) → see cascading effects animated
21. **Concept Library** — searchable catalog of 50+ patterns (consistent hashing, Bloom filter, saga pattern, etc.) each linked to a problem that uses it

---

## Phase 4 — Advanced / Power Features (Month 3+)

Goal: Differentiated features, code generation, community

22. **Code generation** — export design to Docker Compose, OpenAPI spec, Terraform (AWS VPC + RDS + ElastiCache), Kubernetes manifests
23. **Cost Calculator** — component-level AWS/GCP pricing estimate; "knee of curve" heatmap showing cost vs QPS
24. **AI Design Feedback** — LLM-powered review (e.g. "your design has no CDN for static assets, which at 10M users will spike DB read latency")
25. **Anonymous leaderboard** — opt-in benchmark scores per problem, percentile ranking, improvement over time
26. **Community problem submissions** — contribute problems + reference solutions, upvote, curate

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Repo structure | Monorepo (`apps/web` + `apps/server`) | Collaboration requires server-side room state |
| Canvas library | ReactFlow | Better React ecosystem fit, lower learning curve than Cytoscape |
| Real-time | Socket.io | Built-in room management, reconnect, fallback over raw WebSockets |
| Simulation | Web Worker | Keeps canvas 60fps smooth during heavy calculation |
| Persistence (MVP) | localStorage | No auth needed in Phase 0–1; server-side added in Phase 2 |
| AI features | Phase 4 only | Ship real value first; AI as enhancement, not crutch |

## Exclusions

- **Mobile/tablet** — deferred to v2; desktop-first for system design work
- **Live container execution** (MadSim-style) — too infra-heavy for MVP; revisit Phase 4
- **Authentication** — Phase 2 only; Phase 0–1 is fully anonymous

---

## Verification Milestones

| Phase | Pass condition |
|---|---|
| 0 | `npm run dev` opens canvas; drag 3 components, connect them; open two tabs, move a node, see it sync via WebSocket |
| 1 | Add a 10M QPS problem, design a solution, run simulation — bottleneck flagged at the database node |
| 2 | Create interview room, join via link in incognito tab, start timer, verify score delivery at end |
| 3 | Inject a DB failure, verify cascading impact propagates through dependent components |
| 4 | Draw URL Shortener, click Export → Docker Compose, verify valid YAML output |
