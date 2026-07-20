# System Design Simulator

An interactive simulator for exploring and visualizing common system design concepts, architectures, and patterns.

## Overview

System Design Simulator helps engineers learn and practice system design by providing hands-on simulations of distributed systems, scalability patterns, and architectural trade-offs.

## Features

- **Component Visualization** — Visual representation of system components (load balancers, caches, databases, message queues, etc.)
- **Traffic Simulation** — Simulate request flows and observe system behavior under various load conditions
- **Scalability Patterns** — Explore horizontal vs. vertical scaling, sharding, replication, and more
- **Failure Scenarios** — Inject faults and observe how the system responds (circuit breakers, retries, failover)
- **Latency & Throughput Metrics** — Real-time metrics to understand performance bottlenecks

## System Design Concepts Covered

- Load Balancing (Round Robin, Least Connections, Consistent Hashing)
- Caching Strategies (Write-through, Write-back, Cache-aside, Read-through)
- Database Design (SQL vs. NoSQL, Sharding, Replication, CAP Theorem)
- Message Queues & Event Streaming (Pub/Sub, Kafka-style brokers)
- Rate Limiting & Throttling
- API Gateway & Service Mesh
- Content Delivery Networks (CDN)
- Distributed Transactions (Saga, 2PC)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/pradhyumanarora/System-Design-Simulator.git

cd System-Design-Simulator

# Install dependencies
npm install

# Run the simulator
npm start
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT
