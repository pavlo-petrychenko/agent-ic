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
| `references/` | the prompt source and model references; other records are public prefixed ids (D36), never secrets                                                       |
| `outputs/`    | output fields of Agent and Completion steps, `outputToZod` for the `reply` tool (D91), `outputFieldTypes`                                                |
| `conditions/` | router rules, the operator table per type, `evaluateCondition`, `pickRoute`                                                                              |
| `templates/`  | `parseTemplate`, `templateReferences`, `renderTemplate`, `resolvePath`                                                                                   |
| `scope/`      | `visibleVariables`, `createScopeLookup`: what a node may use, its type, if it can be missing; `triggerVariables`                                         |
| `diff/`       | `diffFlows`: what changed between two flows, for comparing versions and the publish dialog                                                               |
| `validation/` | `validateFlow`, `FlowIssueCode`, `hasBlockingIssues`                                                                                                     |
| `versions/`   | `parseFlow`: reads a stored flow, upgrades a version 1 or 2 flow and refuses a schema version it does not know (D77)                                     |
| `settings/`   | flow settings: the default hand-off, what an unhandled step failure does, auto-close after inactivity                                                    |
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
- A message-triggered flow must reach a Send message step, or an Escalation with a customer message, from each message trigger, or it gets the blocking `NO_REPLY_STEP` issue on that trigger.
- Validation does not check the database: whether a referenced prompt, knowledge base or channel exists is checked by the backend publish use case.

## Prompts and reasoning in Agent and Completion steps

- `prompt` is a prompt source, or `null` while the step is a draft:
  - `{ kind: 'library', promptRef, pin, bindings }`: a prompt of the library. `pin` is `{ kind: 'pinned', number }` or `{ kind: 'latest' }`; whether it exists is the backend's check. `bindings` maps each variable declared in the prompt text to a flow variable visible at the node, for example `{ customer_name: 'user.name' }`; the field defaults to `{}` (D273).
- A prompt declares its variables in its text (`{{customer_name}}`, lowercased, letters, digits, `_`, `.` and `-`). The parser and renderer for those tokens are `collectPromptVariables` and `renderPrompt`; they are separate from the flow template parser because prompt names may contain hyphens and are case-insensitive. `renderPrompt` also renders older flow-template tokens, such as `{{ user.name }}` and `{{history[0].text}}`, so prompt text written before the prompt parser existed keeps working. `renameNodeKey` rewrites binding targets.
- The engine resolves a library prompt through the prompts module: the pinned version, or the latest at run start (D269). A step's prompt is always a library reference (D272).
- `reasoning` is a `ReasoningLevel` from `@agent-ic/contracts`, or `null` for the model's default. A stored flow without the field parses as `null`.

## Agent exits and flow settings

- An Agent step has `exits: { end, handoff }`. Each exit is `null` (off) or `{ when }`, the business criterion as a template. `NO_AGENT_EXITS` turns both off.
- A flow has `settings: { handoff, onUnhandledFailure, autoClose }`, each `null` when unset; `NO_FLOW_SETTINGS` is all three unset.
  - `handoff`: the default hand-off, shaped like an Escalation step in `escalate` mode without its messages and reason: `notify`, `reminderAfterMinutes`, `fallbackAfterMinutes`, `fallbackMessage`.
  - `onUnhandledFailure`: `null` fails the run as before; `{ action: 'handoff', customerMessage }` apologises and hands off.
  - `autoClose`: `{ afterMinutes }`, from 1 hour to 30 days (`MIN_AUTO_CLOSE_MINUTES`, `MAX_AUTO_CLOSE_MINUTES`).
- Each exit that is on adds a port named after it (`end`, `handoff`) after `next` and `error`. An exit port left unconnected is not a warning: the Agent step runs the default exit itself.
- While an exit is on, `nodeOutputFields` adds `outcome` (an enum of `continue` and the exits that are on) and `outcome_reason` (a string) right after `messages`, so later steps can read `{{agent.outcome}}`. The two names are reserved only then: a custom output field with one of them gets `DUPLICATE_OUTPUT_FIELD`.
- `validateFlow` refuses an exit on an Agent in a background branch (`EXIT_IN_BACKGROUND_BRANCH`) and warns about an empty `when` (`EMPTY_EXIT_CRITERION`), an exit port wired straight to an Escalation with its own customer message (`EXIT_ESCALATION_MESSAGE`, the Agent's `messages` already are the goodbye) and a default hand-off with an empty fallback message (`NO_FALLBACK_MESSAGE` with the path `['settings', 'handoff', 'fallbackMessage']` and no node).

## Inactivity trigger

- `trigger_inactivity` starts a run in one chat after a stretch of silence. It is part of schema v3. It has one `next` port.
- `silence` and `repeat.every` are `{ amount, unit }` with `unit` `minutes`, `hours` or `days`. `activity` is `any` message or `customer` messages only. `repeat` is `{ kind: 'once' }` or `{ kind: 'every', every, maxTimes }` with `maxTimes` from 2 to 5 (`MIN_INACTIVITY_FIRES`, `MAX_INACTIVITY_FIRES`). `conditions` is `{ notEscalated, channelTypes }`; an empty `channelTypes` means every channel.
- A duration from 5 minutes to 30 days is the intended range (`MIN_INACTIVITY_MINUTES`, `MAX_INACTIVITY_MINUTES`); the schema only requires a positive whole number, and validation refuses a duration outside the range (`INACTIVITY_DURATION_OUT_OF_RANGE`).
- `validateFlow` refuses a second inactivity trigger (`DUPLICATE_INACTIVITY_TRIGGER`) and a flow with no Incoming message or External event trigger (`INACTIVITY_WITHOUT_CONVERSATION_TRIGGER`). It warns about a trigger with no Send message step after it (`INACTIVITY_NO_REPLY_STEP`) and about any fire that is due after `settings.autoClose.afterMinutes` (`INACTIVITY_AFTER_AUTO_CLOSE`), because auto-close counts from the last customer message and closes the chat first.
- `silenceMinutes(node)` and `fireOffsetsMinutes(node)` give the first fire and every fire as minutes after the anchor.
- Variables: `conversation.*`, `user.*`, `channel`, `history` and `inactivity.silent_minutes`, `inactivity.attempt`, `inactivity.max_attempts`, `inactivity.last_author`. `inactivity` is a reserved node key.

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
- `settingsChanges` lists each changed flow setting as a field change, with the path under `settings` (`['autoClose', 'afterMinutes']`).
- Identical flows give a diff whose eight lists are empty.
- `countFlowChanges(diff)` adds up the eight lists: the number of changes the publish and restore dialogs show.
- The web writes each change in plain words ("Schedule trigger: 18:00 instead of 09:30") from these values.

## Change the format

`schemaVersion` is the literal `3`. A change to the format bumps it and adds an upgrade from the previous version in `versions/`, so `parseFlow` keeps reading every stored flow.

- Version 1 had a `role` on each Completion (`guard` or `observer`) and a `guards` value of `waitFor`. `parseFlow` checks a version 1 flow against its own schema and upgrades it with `upgradeFlowV1`: a branch that starts with an observer becomes a background branch, except the first branch of a Parallel whose branches all start with one, which stays waited so the flow keeps a waited branch; `role` is dropped and `guards` becomes `all`.
- Version 2 had no agent exits and no flow settings. `upgradeFlowV2` turns every exit off and leaves every setting unset, so an upgraded flow behaves as before. A version 1 flow goes through `upgradeFlowV1` and then `upgradeFlowV2`. `flow-v2.schema.ts` keeps the version 2 schema.
- Stored rows are not rewritten. The engine and the builder work on the upgraded flow, and the next draft save stores version 3.

## Tests

`pnpm --filter @agent-ic/flow test` runs the specs next to each file. `test/support/fixtures/` holds the three example flows (FAQ with hand-off, scheduled follow-up, event notification) and small node builders for specs.
