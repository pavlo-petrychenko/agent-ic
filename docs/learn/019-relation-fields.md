# 019 Relation fields

[Back to the docs](../README.md)

A relation field is a field of a GraphQL type that points at other data, such as the steps of a run. This page starts from zero: how GraphQL runs a query, why that makes one database query per row unless we take care, and how we batch those queries. Then it gives the recipe for adding a relation field.

## What it is

Some words first. Each one is used in the rest of the page.

- **Query and selection.** A GraphQL query names the fields the client wants, nested like the data. The fields inside a pair of braces are a **selection**. `{ simulation { runs { id steps { id } } } }` selects `simulation`, inside it `runs`, inside each run `id` and `steps`, and inside each step `id`. The server returns exactly that shape and nothing more.
- **Schema.** The SDL files (`modules/<m>/graphql/<m>.graphql`) declare the types and their fields: `type Run { id: ID! steps: [RunStep!]! ... }`.
- **Resolver.** A function the server calls to get the value of one field. In Nest it is a method on a class marked `@Resolver`.
  - A **root resolver** answers a field of `Query`, `Mutation` or `Subscription`, such as `run(id)`. It is where a request enters.
  - A **field resolver** answers a field of some other type, such as `Run.steps`. It is a method marked `@ResolveField()` on a class marked `@Resolver('Run')`.
- **Parent.** The object that holds the field being resolved. When the server resolves `steps` of a run, that run is the parent, and the field resolver gets it through `@Parent()`.
- **Executor.** The part of the GraphQL server that walks the query. For each field in a selection it calls that field's resolver, or, when the type has no resolver for the field, reads the property of the same name from the parent. Then it goes one level down, into each object it got back.

Here is how the executor walks a small query against the simulator, for a simulation with three runs:

```
query { simulation(agentId: "agt_1") { runs { id steps { id } } } }

Query.simulation(agentId)            root resolver        -> the simulation
  Simulation.runs(simulation)        field resolver       -> [run1, run2, run3]
    Run.id(run1)                     property of run1
    Run.steps(run1)                  field resolver       -> [step, step]
    Run.id(run2)                     property of run2
    Run.steps(run2)                  field resolver       -> []
    Run.id(run3)                     property of run3
    Run.steps(run3)                  field resolver       -> [step]
```

`Run.steps` is a **relation field**: its value is not a column of the run, it comes from another table. Its field resolver is called once per parent, here three times.

## Why we have it

**The N+1 problem.** If `Run.steps` runs one SQL query each time it is called, a list of N runs costs 1 query for the list plus N queries for the steps: N+1. Add another relation field and it is N more.

Before this change, the simulator run list paid this even when nobody asked. `Simulation.runs` built every run with its steps and totals up front, so each run cost 3 queries: its steps, the whole flow of its version (only to count the nodes) and a count of its messages. A test chat with 20 runs cost 62 queries, and the web asks for that list again after every chat event, even though the web's `Simulation` query asks for neither steps nor totals.

**Batching.** Instead of answering each call at once, a field resolver asks for its value and waits. Within one **tick** (one turn of the Node.js event loop: the executor calls the field resolver for run1, run2 and run3 one after another before any of them gets an answer), all those requests are collected into one **batch**: the list of keys `[run1, run2, run3]`. The batch is answered with one SQL query that uses `IN (...)`, and each caller gets its part. The same tree now looks like this:

```
Query.simulation(agentId)                       -> 1 call
  Simulation.runs(simulation)                   -> 1 call, 1 query
    Run.steps(run1) \
    Run.steps(run2)  > one batch [run1, run2, run3] -> 1 call, 1 query
    Run.steps(run3) /
```

A list of any length now costs one batch per relation field. The simulator run list costs 2 queries when the client does not ask for steps or totals (the web's case), and 7 when it asks for both (1 for the steps and 4 for the totals), however many runs there are.

**A field resolver does its work only when the field is asked for.** The root resolver returns the run without `steps` and `totals`, so a query that does not select them never pays for them.

## How it works

```
Run.steps(run) field resolver
  @Loader(ListRunStepsUseCase) steps        the loader for this request
  steps.load(run.id)                        waits; the key joins this tick's batch
        |
GraphqlContext.loaders                      one registry per request, made in createContext
  one DataLoader per batch use case class, made on first use, cache: false
  at the end of the tick: keys [run1, run2, run3], duplicates removed
        |
ListRunStepsUseCase.execute(ctx, keys)      a batch use case
  authorize(ctx, Testing, View)
  TenantTransactionService.run(workspaceId)
    RunStepsRepository.listByRuns           one SQL query: run_id IN (...)
  groupByKey(keys, steps, step -> run id)   a map with every key, [] for a run with no steps
        |
DataLoader hands each load its value, in key order
  the field resolver maps the steps to the GraphQL type
```

- **DataLoader** is a small library that does the collecting: `load(key)` returns a promise, and once the current tick is over it calls a batch function once with every key it got. We use the `dataloader` package (D265).
- **A batch use case** is an ordinary use case whose input is a list of keys and whose output is a map from each key to its value: `BatchUseCase<K, V>` in `platform/context`. It checks permissions first and runs one tenant transaction, like every use case.
- **`groupByKey`** (a list per key, for list relations like `Run.steps`) and **`indexByKey`** (one value or `null` per key, for single relations) build that map so that every key is in it, even a key with no rows.
- **The registry** is `GraphqlContext.loaders`. Every HTTP request, and every graphql-ws subscription, gets a new one, so two requests never share a batch. `@Loader(UseCaseClass)` takes the loader for that use case class from it.
- **`GraphqlParent<T, 'field'>`** is the type a root resolver returns: the GraphQL type without the fields that field resolvers fill.

### Why a batch use case, and not a repository

The batch function calls a use case, never a repository, for four reasons:

- **Layers.** Inbound code calls use cases only (depcruise `backend-inbound-uses-use-cases-only`), and ADR 0012 says every GraphQL field that reads data, batches included, goes through a use case.
- **Permissions.** The use case calls `authorize`. A repository checks nothing.
- **Row-level security.** A repository sees tenant rows only inside `TenantTransactionService.run` (page 006).
- **Ids.** Keys are public ids (`run_...`); the use case turns them into internal ids and back.

The low-level part is the repository method, one `IN` query. The batch use case is a thin layer on top. Loaders at the repository level would only help to remove repeated reads inside business logic, which we do not need.

### Why there is no cache

DataLoader can also remember every value it loaded for the rest of the request. We turn that off (`cache: false`) and keep only the batching:

- **Subscriptions.** A graphql-ws context lives as long as the subscription. With a cache, every later event would get the data of the first event.
- **Mutations in one document.** Several mutations in one request run one after another on the same context. With a cache, a later mutation's payload could read a value from before an earlier mutation.

If a real query ever loads the same key in two different ticks, the fix is a cache for queries only, not for subscriptions or mutations.

### Why the `dataloader` package

When a batch runs matters: after all promise callbacks of the tick, with `process.nextTick`. Our own batcher would be easy to get slightly wrong, and then batches would silently split in two. The package is maintained by the GraphQL Foundation and has no dependencies. Only `platform/graphql-server` imports it, so replacing it would change one file.

## Add a relation field

- [ ] Add the field to the type in the module's SDL.
- [ ] Write a batch use case, `implements BatchUseCase<K, V>`: `authorize` first, one `TenantTransactionService.run`, a repository method with one `inArray` query, then `groupByKey` or `indexByKey` over the keys it got.
- [ ] Make the parent's mapper return `GraphqlParent<T, 'field'>`, and remove anything that computed the field before.
- [ ] Write a field resolver: `@Resolver('<Type>')`, a `@ResolveField()` method that takes `@Parent()` and `@Loader(TheUseCase) loader: LoaderOf<TheUseCase>`, and returns `loader.load(parent.id)` mapped to the GraphQL type.
- [ ] Register the use case under `providers` and the resolver under `resolvers` in the module's `defineModule`.
- [ ] Write a spec for the use case (several keys, a key with nothing, another workspace, a refused role), and an integration spec that a list of parents calls the use case once.

## In the code

- [run-fields.resolver.ts](../../apps/backend/src/modules/runs/resolvers/run-fields.resolver.ts): `Run.steps` and `Run.totals`.
- [list-run-steps.use-case.ts](../../apps/backend/src/modules/runs/use-cases/list-run-steps.use-case.ts): a list relation with `groupByKey`.
- [get-run-totals.use-case.ts](../../apps/backend/src/modules/runs/use-cases/get-run-totals.use-case.ts): one value per key with `indexByKey`, built from four `GROUP BY` or `IN` queries.
- [agent-fields.resolver.ts](../../apps/backend/src/modules/agents/resolvers/agent-fields.resolver.ts) and [count-draft-changes.use-case.ts](../../apps/backend/src/modules/agents/use-cases/count-draft-changes.use-case.ts): `Agent.draftChangeCount`, one value per agent from three `IN` queries and an in-memory diff of the flows.
- [last-simulation-run.resolver.ts](../../apps/backend/src/modules/runs/resolvers/last-simulation-run.resolver.ts) and [list-last-simulation-runs.use-case.ts](../../apps/backend/src/modules/runs/use-cases/list-last-simulation-runs.use-case.ts): `Agent.lastSimulationRun`, a field one module adds to another module's type, with `null` for an agent that was never tested.
- [graphql-loaders.helpers.ts](../../apps/backend/src/platform/graphql-server/helpers/graphql-loaders.helpers.ts) and [loader.decorator.ts](../../apps/backend/src/platform/graphql-server/decorators/loader.decorator.ts): the registry and `@Loader`.
- [batch.helpers.ts](../../apps/backend/src/platform/context/helpers/batch.helpers.ts): `groupByKey` and `indexByKey`.
- Spec: [simulator-graphql.spec.ts](../../apps/backend/test/integration/simulator-graphql.spec.ts) reads three runs with their steps and totals and checks that each batch use case ran once; it does the same for a list of three agents with `draftChangeCount` and `lastSimulationRun`.

## Pitfalls

- Never make a resolver request-scoped (`Scope.REQUEST`). Nest would build it again for every request; the loaders already live per request in the context.
- Never import `dataloader` in a module. Depcruise fails (`backend-dataloader-only-in-graphql-server`).
- A map without one of its keys is a bug: that key fails with `BatchKeyMissingError`. Build the map with `groupByKey` or `indexByKey`.
- Keys are the public ids the parent already has, not internal ids.
- There is no cache, on purpose: see [Why there is no cache](#why-there-is-no-cache).
- A relation field inside a subscription payload is batched again for every event, because each event is resolved on its own.
- Never compute a relation field in the root resolver "to save a call": then every query pays for it, asked or not.
- Every query has two limits, checked before any resolver runs (D266). Depth counts how many levels of fields sit inside each other (`{ simulation { runs { steps { id } } } }` is 4 deep); the limit is 10. Complexity adds 1 for every field the query selects; the limit is 100. A query over either limit is refused as a whole with `GRAPHQL_VALIDATION_FAILED`. [graphql-query-limits.spec.ts](../../apps/backend/test/integration/graphql-query-limits.spec.ts) checks every web operation against both, so a new screen that selects too much fails there first: split the query, or raise `MAX_QUERY_DEPTH` or `MAX_QUERY_COMPLEXITY` in `graphql-server.constants.ts` and say why in the pull request.

Next: look at real code in the examples, starting with [the identity module](../examples/identity-module.md). The list is in [the examples section](../README.md#examples) of the docs entry page.
