# 0001. Modular monolith, run as several Deployments

- **Status:** Accepted
- **Date:** 2026-10-02

## Context
The platform has very different workloads:
- bursty customer traffic coming in;
- LLM-bound conversation runs;
- CPU- and memory-heavy document ingestion;
- a dashboard.

Chat traffic has daily peaks, so each workload must scale on its own. The team is 3 people, and the domain will keep changing after the MVP.

## Decision
- One TypeScript codebase and **one image**, run as several Kubernetes Deployments (process roles): `gateway`, `api`, `worker-runs`, `worker-ingest`.
- The code is split into domain modules. Each module owns its tables (one Postgres schema per module) and exposes a public interface.
- Modules never join each other's tables or import each other's internals. CI enforces this.

## Consequences
- Each workload scales independently (HPA / KEDA per Deployment), and every role always runs the same version.
- Calls between modules are in-process, and database transactions are real, so there are no sagas on the hot path.
- Boundaries hold only through discipline: dependency-cruiser runs in CI.
- Every role ships with every merge. Rolling updates and tests reduce the risk.
- Moving a module into its own service later is mechanical. Likely first candidates: ingestion (to switch to Python), gateway, notifications.

## Alternatives considered
- **Microservices:** they solve team and organisational scaling, not load scaling. They would add synchronous calls or copied data on the hot path (the flow engine needs agents, prompts, KBs, channels, conversations and usage), plus sagas, contract versioning, N pipelines and a higher idle cost. Too much for 3 people with a domain that is still changing.
- **A single-process monolith:** ingestion and live chats would compete for the same pods, and nothing could scale separately.
