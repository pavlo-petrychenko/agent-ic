# 0022. A foreign key for every reference

- **Status:** Accepted
- **Date:** 2026-10-21

## Context

- An audit of the schema found columns that hold another row's id and have no foreign key. Each time the reason was an import: the key would need one table file to import another across modules (D196, D221, D229, D230) or in a cycle (D175, D259), and the backend rules allowed another module only through its `index.ts`.
- Without the key the database does not guarantee referential integrity. Deleting a workspace needed three cleanup jobs that finish eventually (D229), and some single-column keys let a child row point at a parent of another workspace, because Postgres checks foreign keys without applying RLS.
- Drizzle 0.45 stores the extra-config callback of a table and calls it later, and `.references()` takes a callback. A table file therefore reads another table lazily, so a cycle between table files is harmless as long as nothing else is evaluated at load time. The only things a table file evaluates at load time are its `pgSchema` object and its enums.

## Decision

1. **Every column that holds another row's id has a foreign key**, also across modules and in both directions of a cycle. A missing import is never a reason to skip one.
2. **A `db/` file may import another module's `db/` files directly.** It is the only cross-module import that skips `index.ts`. A table never imports another module's `index.ts`, because that would load the whole module graph into the cycle. `.dependency-cruiser.cjs` enforces it with `backend-db-imports-only-db`, and `backend-cross-module-through-index` no longer applies to `db/` files.
3. **Table files may import each other in a cycle.** A table file reads another table only inside `.references(() => …)` and the extra-config callback. `import/no-cycle` is off for `db/*.table.ts`.
4. **The leaf-file pattern:** the module's `pgSchema` and its Postgres enums live in `db/<module>.pg-schema.ts`, which imports no table file. Table files import it. A module's enum may reuse another module's enum from that module's `pg-schema` file.
5. Repositories still query only their own module's tables; "no joins across schemas" is unchanged.
6. `drizzle.config.ts` reads `*.pg-schema.ts` as well as `*.table.ts`, so drizzle-kit sees the schemas and enums.

## Consequences

- The rule and its tooling landed first and changed no database object. The keys, the on-delete policy and the removal of the D229 cleanup jobs followed in migration `0022_foreign-keys`, the contract step (D273 holds the policy): `workspace_id` cascades from the workspace, ownership keys cascade and are composite `(workspace_id, x_id)`, nullable pointers are single-column `set null`, keys the product forbids deleting restrict, and the history of soft-deleted agents is `no action`.
- Deleting a workspace removes all its rows in one statement, so it is immediately consistent and needs no job.
- `test/integration/foreign-keys.spec.ts` is the tool behind the rule: it fails on an id column without a key, a tenant table whose `workspace_id` has no key to the workspace, and a key without an index.
- Rows that point at a row that does not exist yet now fail at once, so writes follow the key order: an agent is inserted before it points at its draft, and a run is inserted before its conversation points at it.
- A table file can import another module's table file, so a change to a table of one module can force a rebuild of the types of another. This is the price of a real key.
- The load-time exception (`pgSchema` and enums) is easy to break by accident. A table file that evaluates another table at load time fails when the cycle is first loaded, which the test suite hits at once.

## Alternatives considered

- **Keep skipping keys across modules and rely on jobs and events:** rejected. It leaves orphans possible and cross-workspace pointers unchecked.
- **Import through the module `index.ts`:** rejected. Table files would load services and repositories, and the module graph would become one cycle.
- **Move all tables into one shared schema package:** rejected. It breaks the rule that each module owns its schema and its tables.
- **Keep enums in the table files and break cycles with raw SQL names:** rejected. It hides the dependency from drizzle-kit and gives up the typed enum columns.
