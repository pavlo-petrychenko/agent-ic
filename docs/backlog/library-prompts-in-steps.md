# Library prompts in Agent and Completion steps

## Now
- The prompt of an Agent or Completion step is a prompt source, `{ kind: inline, text }` or `{ kind: library, promptRef, pin }`.
- The engine resolves library prompts at run start: the pinned version, or the latest (D265).
- The flow builder shows an inline prompt editor with variable chips.

## When the prompt library lands
1. The step inspectors show the library picker from the design (`MVP-FlowBuilder`, `MVP-FB-Completion`): pick a prompt, pin a version or follow the latest, open it in the library. *(open)*
2. The engine resolves `{ kind: library, promptRef, pin }` through the prompts module: the pinned version, or the latest at run start. *(done, D265)*
3. Publish checks that the referenced prompt and version exist (a `FlowReferenceChecker` in the prompts module). *(done, D266)*
4. Traces are tagged with the prompt id and version (D47). *(done, D265)*
5. Existing flows with inline prompts are migrated into library prompts, then `inline` is removed from the schema in a contract step. *(open)*

## Depends on
- The prompt library picker in the flow builder.
