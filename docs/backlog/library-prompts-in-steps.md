# Library prompts in Agent and Completion steps

## Now
- The Agent and Completion steps hold an inline prompt: the prompt source in `@agent-ic/flow` is `{ kind: inline, text }`.
- The flow builder shows an inline prompt editor with variable chips.
- The engine renders the inline text.

This is temporary, until the prompt library exists.

## When the prompt library lands
1. The step inspectors show the library picker from the design (`MVP-FlowBuilder`, `MVP-FB-Completion`): pick a prompt, pin a version or follow the latest, open it in the library.
2. The engine resolves `{ kind: library, promptRef, pin }` through the prompts module: the pinned version, or the latest at run start.
3. Publish checks that the referenced prompt and version exist (a `FlowReferenceChecker` in the prompts module).
4. Traces are tagged with the prompt id and version (D47).
5. Existing flows with inline prompts are migrated into library prompts, then `inline` is removed from the schema in a contract step.

## Depends on
- The prompts module (saving and versions).
