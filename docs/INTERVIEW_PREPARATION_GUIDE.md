# System Design Interview Preparation Guide

This guide explains how to use every feature in System Design Simulator as part
of deliberate interview practice. The goal is not only to produce a diagram,
but to practise the complete reasoning process expected in a system design
round: clarify requirements, estimate scale, define contracts and data, propose
an architecture, test it, and communicate trade-offs.

## Recommended Practice Loop

Use the features in the same order you would structure a real interview:

1. Pick a problem and restate it in your own words.
2. Define functional requirements and explicitly remove out-of-scope features.
3. Write measurable non-functional requirements.
4. Estimate traffic, bandwidth, and storage.
5. Define the important APIs and data model.
6. Draw the high-level architecture and explain every connection.
7. Configure realistic capacity and latency assumptions.
8. Stress the design with the traffic simulator.
9. Fix bottlenecks and single points of failure.
10. Review the score and record the trade-offs you made.

For maximum value, complete the first attempt without looking up a reference
architecture. Research the gaps afterward, then rebuild the design from a blank
canvas on another day.

## Seed Problems

### How this helps

The built-in problems provide realistic prompts, target traffic, starter
architectures, requirements, APIs, and trade-off notes. They reduce setup time
and expose you to common interview patterns:

- URL Shortener: read-heavy access, caching, key generation, and redirects.
- Social Feed: fan-out strategies, timelines, and eventual consistency.
- Distributed Rate Limiter: low-latency counters and distributed coordination.
- File Upload System: resumable uploads, object storage, and asynchronous work.
- Notification Service: queues, delivery channels, retries, and fan-out.

### How to use it

Open **Problems** and select a prompt. Read the description and target QPS, then
inspect the supplied notes and architecture. Treat the loaded design as a
starting point, not an answer to memorize.

### Use it to full calibre

- Before editing, explain why every supplied component exists.
- Remove one component and predict the failure before checking the simulator.
- Rebuild the same problem using a different strategy, such as SQL instead of
  NoSQL or fan-out on read instead of fan-out on write.
- Practise each problem twice: once untimed for learning and once in 35-45
  minutes for interview readiness.
- Keep a list of patterns that repeat across problems, such as caching,
  partitioning, replication, queues, idempotency, and backpressure.

## Design Notes

Design Notes turns the canvas into a structured interview answer. Open it from
the header and work through all four tabs.

### Functional requirements

**How this helps:** Interviewers expect candidates to narrow an ambiguous
prompt before designing. A concise requirement list prevents scope creep and
keeps the architecture tied to user-visible behavior.

**How to use it:** Add the core actions the system must support. Mark an item
complete only after the architecture, API, and data model support it.

**Use it to full calibre:**

- Prefer testable statements such as "A user can resume an interrupted upload."
- Keep the initial scope to three to five essential capabilities.
- State important exclusions aloud, such as analytics, billing, or moderation.
- At the end, use the checklist to prove that no requirement was forgotten.

### Non-functional requirements

**How this helps:** Availability, latency, scale, consistency, and durability
drive architecture decisions. Quantifying them demonstrates that choices are
based on constraints rather than fashion.

**How to use it:** Fill in each field with a measurable target. Use
**Apply to NFRs** in Capacity Planning to transfer the calculated scale into the
Scale field.

**Use it to full calibre:**

- Avoid vague goals such as "fast" or "highly available."
- Use percentiles for latency, for example, "p99 reads below 150 ms."
- Identify which operations need strong consistency and which can be eventual.
- Define acceptable data loss and recovery expectations when durability matters.
- Explain conflicts between NFRs, such as consistency versus availability or
  latency versus cost.

### API design

**How this helps:** APIs reveal the system boundary, access patterns, and
required data. They also expose concerns such as pagination, idempotency,
authentication, rate limits, and asynchronous processing.

**How to use it:** Add the primary endpoints, select the HTTP method, and record
the path, purpose, request, and response.

**Use it to full calibre:**

- Design only the APIs needed by the core requirements.
- Include stable identifiers, validation errors, and status codes in your
  verbal explanation.
- Use cursor pagination for large or frequently changing collections.
- Add idempotency keys to retryable write operations such as payments or job
  creation.
- For long-running work, return a job identifier and provide a status endpoint
  instead of holding the request open.

### Data and trade-off notes

**How this helps:** Strong candidates explain alternatives, failure modes, and
why a design is appropriate for the stated constraints. Recording these points
builds the communication skill that separates a diagram from a design.

**How to use it:** Summarize entities, indexes, partition keys, and important
access patterns. Record alternatives considered, known bottlenecks, and future
improvements.

**Use it to full calibre:**

- Write each decision as "We choose X over Y because Z."
- Include the downside of the selected option.
- Note hot-key risks, data growth, retry behavior, and operational complexity.
- Finish with the first two improvements you would make if requirements grew by
  10x.

## Capacity Planning

### How this helps

Capacity estimation converts product assumptions into engineering constraints.
It trains the back-of-the-envelope calculations commonly expected before an
architecture is finalized.

The workspace calculates:

- Daily requests and average QPS.
- Peak QPS and its read/write split.
- Ingress and egress bandwidth.
- Raw daily storage and retained replicated storage.
- Approximate replicated storage per year.
- Whether the configured architecture has enough read and write throughput.

### How to use it

Open **Capacity** and enter:

- Daily active users and actions per user per day.
- Read percentage and peak traffic multiplier.
- Average request and response sizes.
- Stored bytes per write, retention period, and replication factor.

Review the calculated demand, then compare it with **Architecture Capacity
Check**. Use **Apply to NFRs** to preserve the result in Design Notes.

### Use it to full calibre

- State every assumption before calculating. Interviewers care about the method
  more than exact numbers.
- Use round numbers that are easy to verify mentally.
- Calculate a normal case and a peak case.
- Perform sensitivity checks: increase users, actions, or retention by 10x and
  identify which part of the design fails first.
- Translate results into decisions. High read QPS may justify caching; high
  write QPS may require partitioning or batching; large egress may justify a
  CDN; large retained storage may require lifecycle policies.
- Do not treat the architecture check as exact production sizing. It is a
  consistency check between your assumptions and configured component capacity.

## Architecture Canvas

### How this helps

The canvas develops the ability to turn requirements into a clear, explainable
high-level design. The available components cover common building blocks:
clients, DNS, CDN, API gateways, load balancers, application servers, caches,
SQL and NoSQL databases, queues, and object storage.

### How to use it

Select components from the palette, position them on the canvas, and connect
their handles to show request or data flow. Select a node to configure it.
Select an edge and press **Delete** or **Backspace** to remove it.

### Use it to full calibre

- Build the happy-path request flow first, from client to durable storage.
- Add complexity only when a requirement justifies it.
- Label components by responsibility, such as "Feed Service" or "Metadata DB,"
  rather than leaving only generic technology names.
- Explain whether each connection is synchronous or asynchronous.
- Discuss timeout, retry, idempotency, and backpressure behavior at important
  boundaries.
- Trace one write path and one read path end to end.
- After the main flow works, discuss observability, security, deployment, and
  disaster recovery verbally even if they are not represented as nodes.

## Component Configuration

### How this helps

Configuring replicas, read throughput, write throughput, and latency turns a
conceptual diagram into a testable model. It trains you to connect scaling
claims with explicit assumptions.

### How to use it

Select an architecture node and edit:

- **Replicas:** number of independent instances.
- **Read Throughput:** requests per second handled by one instance.
- **Write Throughput:** writes per second handled by one instance.
- **Latency SLA:** expected contribution to request latency.

### Use it to full calibre

- Start with conservative per-instance capacity instead of numbers chosen only
  to pass the simulation.
- Distinguish stateless horizontal scaling from stateful replication.
- Explain whether adding replicas increases write capacity for that technology.
- Reserve headroom rather than designing for sustained 100% utilization.
- Identify autoscaling signals, minimum replica counts, and stateful failover
  behavior in your verbal answer.

## Traffic Simulation and Live Metrics

### How this helps

The simulator provides immediate feedback on whether the diagram and component
configuration can handle the selected traffic. It highlights bottlenecks,
single points of failure, per-node QPS, and accumulated p50/p99 latency.

### How to use it

Set **Ingress QPS** in Live Metrics. The simulation updates as the architecture
or configuration changes. Inspect total QPS, system p99 latency, bottleneck and
SPOF counts, then review each component.

### Use it to full calibre

- Begin with estimated average QPS, then test peak QPS from Capacity Planning.
- Increase traffic gradually to find the design's breaking point.
- Before changing anything, explain why the flagged node is saturated.
- Fix one constraint at a time and observe the effect.
- Do not solve every bottleneck by adding replicas. Consider caching, data
  partitioning, batching, queues, denormalization, and reduced payload size.
- Use SPOF warnings to discuss redundancy, failover, quorum, and multi-zone
  deployment.
- Treat latency as a path budget: allocate the total SLA across network,
  compute, cache, and storage operations.

## Data Model Canvas

### How this helps

The Data Model workspace connects access patterns to storage design. It helps
you practise entity boundaries, keys, nullability, relationships, and the
differences between logical modeling and physical storage.

### How to use it

Open **Data Model**, add entities, and connect them to create relationships.
Select an entity to rename it, add fields, select field types, mark primary
keys, control nullability, and edit relationship cardinality.

### Use it to full calibre

- Derive entities from requirements and APIs, not from intuition alone.
- Choose keys that support distribution and avoid hotspots.
- For every main API, identify the query pattern and required index.
- Explain whether a relationship will be normalized, denormalized, embedded, or
  maintained asynchronously.
- For many-to-many relationships, describe the join or mapping entity.
- Discuss partition keys, sort keys, secondary indexes, retention, and deletion.
- Keep the canvas logical, then explain the physical differences if using SQL,
  document storage, wide-column storage, or object storage.

## Design Scoring

### How this helps

The score provides a fast review of several common baseline concerns: target
QPS, single points of failure, caching, load balancing, and p99 latency. It
helps reveal omissions during repeated practice.

### How to use it

Load a seed problem or build a design, configure its components, set the
relevant traffic, and select **Score**. Read the breakdown rather than focusing
only on the total.

### Use it to full calibre

- Treat the score as a checklist, not as proof of a production-ready design.
- Explain when a cache or load balancer is unnecessary instead of adding one
  only for points.
- Fix failed categories and score again to practise iterative design.
- Supplement the score with manual review of correctness, consistency,
  partitioning, security, observability, cost, and disaster recovery.
- Save screenshots of early and final attempts to measure improvement in
  clarity and completeness.

## Persistence, Clear, and PNG Export

### How this helps

Automatic local persistence supports multi-session practice, while PNG export
creates a review artifact that can be discussed with a peer or mentor.

### How to use it

Work is saved automatically in the current browser. Use **Export PNG** to
capture the architecture. Use **Clear** only when you want to reset the current
design and notes.

### Use it to full calibre

- Export the design before and after fixing simulation findings.
- Review the PNG without the application and ask whether the flow is
  understandable without explanation.
- Pair the image with your written requirements, estimates, and trade-offs.
- Remember that browser storage is local to the device and browser profile; it
  is not a permanent cloud backup.

## Real-Time Collaboration

### How this helps

Collaboration can support mock interviews and peer design reviews. One person
can act as candidate while another observes the evolving architecture.

### How to use it

Run the frontend with the Socket.IO server and use the shared room-backed
session. Basic architecture changes synchronize through the server. The static
GitHub Pages deployment works without the server, so real-time collaboration is
disabled there.

### Use it to full calibre

- Assign one participant as interviewer and one as candidate.
- The interviewer should ask clarifying and failure-oriented questions rather
  than editing the solution.
- Pause at 15-minute intervals to summarize decisions and remaining risks.
- End with structured feedback on requirements, estimation, architecture,
  bottleneck analysis, data modeling, and communication.
- Because collaboration is currently basic, confirm important notes verbally
  and use a single candidate-controlled browser as the source of truth.

## A 45-Minute Mock Interview Plan

| Time | Activity | Features |
|---|---|---|
| 0-5 min | Clarify scope and list core use cases | Problems, Functional Requirements |
| 5-10 min | Define SLAs and estimate scale | NFRs, Capacity Planning |
| 10-15 min | Define contracts and core entities | API Design, Data Model |
| 15-30 min | Build and explain the high-level design | Architecture Canvas, Configuration |
| 30-37 min | Stress the design and remove critical risks | Simulation, Live Metrics |
| 37-42 min | Discuss alternatives, failures, and growth | Trade-off Notes, Capacity Planning |
| 42-45 min | Summarize and review gaps | Score, Requirements Checklist |

## Self-Review Checklist

After each practice session, confirm that you can answer:

- Did I clarify what is in and out of scope?
- Are my NFRs measurable?
- Can I reproduce my capacity calculations without the tool?
- Does every API map to a functional requirement?
- Does the data model support the main access patterns?
- Can I trace reads, writes, failures, and retries through the architecture?
- Did I identify bottlenecks and single points of failure?
- Did I explain consistency, partitioning, replication, and caching choices?
- Did I state at least two meaningful trade-offs?
- Could another engineer understand my exported design?

The strongest preparation comes from repeating this process until the structure
becomes automatic while the design decisions remain specific to the problem.
