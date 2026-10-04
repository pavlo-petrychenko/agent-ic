# 0012. Layering: transport → use case → service → repository

- **Status:** Accepted
- **Date:** 2026-10-03
- **Supersedes:** the cross-module rule in ADR 0009 ("another module is used only through its public use cases and read services, never its repositories") and ADR 0010, point 4 ("each domain module exports only its public use cases and read services").

## Context
- ADRs 0009 and 0010 fixed transport-agnostic use cases and Nest constructor DI, but not the layers below a use case or what one module may use from another.
- Without a rule, use cases start calling each other. Then permissions are checked twice, the transaction boundary is unclear, and the call graph becomes a web.

## Decision
1. **Four layers, each with one job:**

   | Layer | Job | Checks permissions | Transaction |
   |---|---|---|---|
   | **Transport**: resolver, controller, job processor | Parse input, build `ctx`, call **one use case**, map the result and errors | Authenticates only | — |
   | **Use case** | One operation a caller can trigger (`PublishVersion`, `StartIngestion`) | ✅ `ctx.authorize()` | ✅ the boundary (ADR 0013) |
   | **Service** | Reusable logic shared by use cases, possibly across modules (`KnowledgeSearchService`, `UsageMeterService`) | ❌ trusts its caller | Joins the caller's |
   | **Repository** | Data access, scoped by `ctx.workspaceId` | ❌ | Joins the caller's |

2. **Allowed calls:**
   ```
   transport ──► use case ──► service ──► repository
                    │            └──► service
                    └──► repository
   ```
   - A **use case never calls another use case**. Shared logic moves into a service.
   - A **transport never touches services or repositories**. Even a simple read goes through a use case, so permissions are always checked.
   - Use cases and services **may use services and repositories of other modules**, for reads and writes.
3. **Module `exports`:**
   - A core module exports its **services and repositories** for other modules.
   - It exports its **use cases** only for its own transport modules (`<m>.graphql-module`, `<m>.http-module`, `<m>.jobs-module`).
4. **Enforcement:** dependency-cruiser rules by file suffix, checked in CI:
   - `*.use-case.ts` is imported only by `graphql/`, `http/` and `jobs/` files of the same module;
   - `*.resolver.ts`, `*.controller.ts` and `*.processor.ts` import only use cases (plus DTOs and mappers);
   - `*.use-case.ts` and `*.service.ts` never import a use case.

## Consequences
- One use case means one permission check and one transaction. A transport's behaviour can be read from a single use case.
- Every GraphQL field that needs data, DataLoader batches included, goes through a use case. That means more small "query" use cases, but no unchecked read path.
- **Writes into another module's tables skip that module's services.** For example, `runtime` writing messages straight into `conversations` would bypass the escalation state machine or the unread counters. Code review must catch writes that need the owning module's rules and route them through its service instead.
- Nest cannot restrict an export to "my own transport modules". The use-case rule relies on dependency-cruiser, not on the container.

## Alternatives considered
- **Use cases may call use cases:** reuses entry points directly, but permissions get checked twice, the transaction boundary is unclear and the call graph tangles.
- **Other modules' repositories are read-only; writes go through their services:** protects module invariants, but adds service methods that only forward calls. The team chose direct access plus code review.
- **Transports may call read services directly:** less code for simple reads, but authorization can be forgotten on a read path.
