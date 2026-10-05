# Architecture Decision Records

One file per decision. ADRs are never edited after they are accepted, except for their status. A changed decision gets a new ADR that supersedes the old one.

Smaller decisions, and amendments to these ADRs, are rows D1 to D190 in section 1 of [architecture.md](../architecture.md). The Status column below summarises the status line of each file.

| # | Decision | Status |
|---|---|---|
| [0001](0001-modular-monolith.md) | Modular monolith, run as several Deployments | Accepted |
| [0002](0002-separate-gateway-deployment.md) | Separate `gateway` Deployment for channel ingress | Accepted |
| [0003](0003-pnpm-turborepo-monorepo.md) | pnpm workspaces + Turborepo monorepo | Accepted |
| [0004](0004-app-repo-and-deploy-repo.md) | App repo + deploy repo; Helm chart published as OCI | Accepted; amended: no Terraform until the AWS move, `bootstrap/` Ansible, no cert-manager on the homeserver (D68, D69, D74) |
| [0005](0005-graphql-schema-first.md) | GraphQL schema-first for the dashboard API; REST for the gateway | Accepted; amended: session operations are REST under `/api/auth` (D92, D163) |
| [0006](0006-graphql-subscriptions-redis.md) | Realtime through GraphQL subscriptions over Redis pub/sub | Accepted |
| [0007](0007-generated-schema-not-committed.md) | The merged GraphQL schema is generated, not committed | Accepted |
| [0008](0008-telegram-webhooks-polling-for-dev.md) | Telegram: webhooks in production, long polling only for local dev | Accepted |
| [0009](0009-transport-agnostic-use-cases.md) | Transport-agnostic use cases, permissions in the use case, service-locator context | Accepted; point 3 superseded by 0010, cross-module rule by 0012 |
| [0010](0010-nestjs-native-di.md) | NestJS with native DI; classes everywhere | Accepted; point 4 superseded by 0012 |
| [0011](0011-knowledge-base-and-retrieval.md) | Knowledge base ingestion and retrieval | Accepted |
| [0012](0012-layering-transport-use-case-service-repository.md) | Layering: transport → use case → service → repository | Accepted |
| [0013](0013-transactions-cls-and-postgres-rls.md) | Transactions through CLS; tenant isolation with repositories + Postgres RLS | Accepted |
| [0014](0014-domain-errors-and-transport-mapping.md) | Domain errors and their mapping per transport | Accepted |
| [0015](0015-jobs-after-commit-and-durable-outbox.md) | Jobs and events after commit; a durable outbox for critical paths | Accepted; amended: domain events, listeners declared by `defineModule` (D80, D112, D143, D145) |
| [0016](0016-run-traces-in-postgres-langfuse-optional.md) | LLM traces in Langfuse for the MVP; our own run traces later | Accepted; amended: self-hosted Langfuse after the RAM upgrade, Langfuse Cloud as fallback (D47) |
| [0017](0017-prompt-editor-tiptap.md) | Prompt editor on Tiptap | Accepted |
| [0018](0018-code-editor-codemirror.md) | CodeMirror 6 for the code editor | Accepted |

## Template

```markdown
# NNNN. Title

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD

## Context
What forces us to decide; constraints.

## Decision
What we do.

## Consequences
What gets easier, what gets harder, what we must now do.

## Alternatives considered
Each option and why we didn't pick it.
```
