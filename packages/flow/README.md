# @agent-ic/flow

The flow contract (D192): the zod schema of the flow document, the `{{…}}` template parser, variable scope, router conditions and validation before publish. Every function is pure and returns plain data; a helper throws only for a programmer error.

Used by `apps/backend` (flow engine, interpolation, publish) and `apps/web` (builder canvas, inspectors, autocomplete, checks before publish).

Must not hold: execution code that needs I/O, database or framework code, or UI components. dependency-cruiser forbids Node built-ins and every npm package except `zod` in its source; the other workspace import is `@agent-ic/contracts`.

## What it holds

Each folder under `src/` is a topic, and inside it files sit in a folder per kind: `constants/`, `helpers/` (with their specs), `schemas/` and `typedefs/`, as in the backend modules. A folder appears only when it has files.

| Folder        | What                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `document/`   | `flowDocumentSchema`, the inferred types (`FlowDocument`, `FlowNode`, a type per node, `FlowEdge`), `NodeType`, `PortName`, `nodePorts`, `renameNodeKey` |
| `nodes/`      | one schema per node type and the enums of their configs                                                                                                  |
| `references/` | the prompt source (`library` or `inline`) and model references; other records are public prefixed ids (D36), never secrets                               |
| `outputs/`    | output fields of Agent and Completion steps, `outputToZod` for the `reply` tool (D91), `outputFieldTypes`                                                |
| `conditions/` | router rules, the operator table per type, `evaluateCondition`, `pickRoute`                                                                              |
| `templates/`  | `parseTemplate`, `templateReferences`, `renderTemplate`, `resolvePath`                                                                                   |
| `scope/`      | `visibleVariables` and `createScopeLookup`: every variable a node may use, with its type and whether it can be missing                                   |
| `diff/`       | `diffFlows`: what changed between two flows, for comparing versions and the publish dialog                                                               |
| `validation/` | `validateFlow`, `FlowIssueCode`, `hasBlockingIssues`                                                                                                     |
| `versions/`   | `parseFlow`: reads a stored flow and refuses a schema version it does not know (D77)                                                                     |
| `limits/`     | node, edge, rule, branch, output and template limits                                                                                                     |

## Use it

```ts
import { hasBlockingIssues, parseFlow, renderTemplate, validateFlow } from '@agent-ic/flow';

const issues = validateFlow(draft);
const publishable = !hasBlockingIssues(issues);

const parsed = parseFlow(version.flow);
const text = parsed.ok ? renderTemplate('Your order {{event.order.id}}', resolve) : null;
```

- Publish refuses a flow with any `error` issue. The builder shows every issue live, and the web turns each `FlowIssueCode` into text through i18n.
- The engine and the simulator both route with `pickRoute(rules, resolve)`, so they agree.
- A missing value renders as empty text, and every condition except `is_empty` fails on it.
- A message-triggered flow must reach a Send message step from each message trigger, or it gets the blocking `NO_REPLY_STEP` issue on that trigger.
- Validation does not check the database: whether a referenced prompt, knowledge base or channel exists is checked by the backend publish use case.

## Prompts and reasoning in Agent and Completion steps

- `prompt` is a prompt source, or `null` while the step is a draft:
  - `{ kind: 'inline', text }`: a template, checked like every other template and rewritten by `renameNodeKey`. A blank text counts as missing (`MISSING_PROMPT`).
  - `{ kind: 'library', promptRef, pin }`: a prompt of the library, `pin` is `{ kind: 'pinned', number }` or `{ kind: 'latest' }`. Whether it exists is the backend's check.
- Only `inline` is used until the prompt library lands (`docs/backlog/library-prompts-in-steps.md`).
- `reasoning` is a `ReasoningLevel` from `@agent-ic/contracts`, or `null` for the model's default. A stored flow without the field parses as `null`.

## Compare two flows

`diffFlows(a, b)` returns a `FlowDiff`: what changed from `a` (the older flow) to `b`.

- Nodes are matched by `id`, which never changes. `addedNodes` and `removedNodes` hold the whole nodes.
- `renamedKeys` lists `{ nodeId, from, to }` for each node whose key changed. A rename is not also reported as a change to the templates that refer to the key, so a flow passed through `renameNodeKey` differs only by the rename, and swapped keys are two renames.
- `changedNodes` lists `{ nodeId, key, type, fields }` for each kept node that changed. Each field is `{ path, before, after }`, with the path under the node (`['config', 'schedule', 'time']`) and the old and new values; a missing value is `null`. Objects are compared field by field, a list is one value. `id` and `key` are never fields.
- Edges are matched by their ends (`source`, `sourcePort`, `target`), not their `id`. `addedEdges` and `removedEdges` hold the whole edges.
- Identical flows give a diff whose six lists are empty.
- The web writes each change in plain words ("Schedule trigger: 18:00 instead of 09:30") from these values.

## Change the format

`schemaVersion` is the literal `1`. A change to the format bumps it, adds a migration function from the previous version in this package, and ships with the data migration of D77.

## Tests

`pnpm --filter @agent-ic/flow test` runs the specs next to each file. `test/support/fixtures/` holds the three example flows (FAQ with hand-off, scheduled follow-up, event notification) and small node builders for specs.
