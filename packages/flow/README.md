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
| `references/` | prompt and model references; other records are public prefixed ids (D36), never secrets                                                                  |
| `outputs/`    | output fields of Agent and Completion steps, `outputToZod` for the `reply` tool (D91), `outputFieldTypes`                                                |
| `conditions/` | router rules, the operator table per type, `evaluateCondition`, `pickRoute`                                                                              |
| `templates/`  | `parseTemplate`, `templateReferences`, `renderTemplate`, `resolvePath`                                                                                   |
| `scope/`      | `visibleVariables` and `createScopeLookup`: every variable a node may use, with its type and whether it can be missing                                   |
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
- Validation does not check the database: whether a referenced prompt, knowledge base or channel exists is checked by the backend publish use case.

## Change the format

`schemaVersion` is the literal `1`. A change to the format bumps it, adds a migration function from the previous version in this package, and ships with the data migration of D77.

## Tests

`pnpm --filter @agent-ic/flow test` runs the specs next to each file. `test/support/fixtures/` holds the three example flows (FAQ with hand-off, scheduled follow-up, event notification) and small node builders for specs.
