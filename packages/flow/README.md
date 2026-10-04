# @agent-ic/flow

The flow graph: zod schema, graph validation and the template `{{...}}` parser.

Used by `apps/backend` (flow engine, interpolation) and `apps/web` (builder, autocomplete).

Must not hold: execution code that needs I/O, database or framework code, or UI components.
