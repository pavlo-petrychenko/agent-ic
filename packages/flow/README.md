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
| `scope/`      | `visibleVariables`, `createScopeLookup`: what a node may use, its type, if it can be missing; `triggerVariables`                                         |
| `diff/`       | `diffFlows`: what changed between two flows, for comparing versions and the publish dialog                                                               |
| `validation/` | `validateFlow`, `FlowIssueCode`, `hasBlockingIssues`                                                                                                     |
| `versions/`   | `parseFlow`: reads a stored flow, upgrades a version 1 flow and refuses a schema version it does not know (D77)                                          |
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

## Parallel branches

- Each `branches` edge of a Parallel step starts one branch. By default the join waits for it (`waitFor` is `all` or `first`), and its outputs are visible after the join.
- An edge with `background: true` starts a background branch: the join does not wait for it and its outputs are not visible after the join. Its steps still see each other's outputs, and the run ends only after it finishes. `isBackgroundBranch(graph, edge)` tells them apart.
- A missing `background` means the join waits for the branch.
- `validateFlow` refuses a Send message step in any branch, an Escalation in a background branch (`ESCALATION_IN_BACKGROUND_BRANCH`), `background` on an edge that is not a `branches` edge (`BACKGROUND_OUTSIDE_BRANCHES`) and a Parallel step whose branches all run in the background (`NO_WAITED_BRANCH`). An Escalation in a waited branch is allowed: it ends the run, so its path never reaches the join.

## Compare two flows

`diffFlows(a, b)` returns a `FlowDiff`: what changed from `a` (the older flow) to `b`.

- Nodes are matched by `id`, which never changes. `addedNodes` and `removedNodes` hold the whole nodes.
- `renamedKeys` lists `{ nodeId, from, to }` for each node whose key changed. A rename is not also reported as a change to the templates that refer to the key, so a flow passed through `renameNodeKey` differs only by the rename, and swapped keys are two renames.
- `changedNodes` lists `{ nodeId, key, type, fields }` for each kept node that changed. Each field is `{ path, before, after }`, with the path under the node (`['config', 'schedule', 'time']`) and the old and new values; a missing value is `null`. Objects are compared field by field, a list is one value. `id` and `key` are never fields.
- Edges are matched by their ends (`source`, `sourcePort`, `target`), not their `id`. `addedEdges` and `removedEdges` hold the whole edges. `changedEdges` holds the new edge of each branch switched between waited and background.
- Identical flows give a diff whose seven lists are empty.
- `countFlowChanges(diff)` adds up the seven lists: the number of changes the publish and restore dialogs show.
- The web writes each change in plain words ("Schedule trigger: 18:00 instead of 09:30") from these values.

## Change the format

`schemaVersion` is the literal `2`. A change to the format bumps it and adds an upgrade from the previous version in `versions/`, so `parseFlow` keeps reading every stored flow.

- Version 1 had a `role` on each Completion (`guard` or `observer`) and a `guards` value of `waitFor`. `parseFlow` checks a version 1 flow against its own schema and upgrades it with `upgradeFlowV1`: a branch that holds an observer becomes a background branch, `role` is dropped and `guards` becomes `all`.
- Stored rows are not rewritten. The engine and the builder work on the upgraded flow, and the next draft save stores version 2.

## Tests

`pnpm --filter @agent-ic/flow test` runs the specs next to each file. `test/support/fixtures/` holds the three example flows (FAQ with hand-off, scheduled follow-up, event notification) and small node builders for specs.
