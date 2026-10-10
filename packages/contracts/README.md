# @agent-ic/contracts

Constants and small pure helpers that backend and web must both execute and GraphQL cannot type: the role to permission matrix, plan limits, error codes, ID prefixes, supported locales, LLM reasoning levels (`ReasoningLevel`, lowest first in `REASONING_LEVEL_ORDER`).

Used by `apps/backend` and `apps/web`.

Must not hold: types that come from the GraphQL schema, anything with I/O, framework code, or dependencies on apps.
