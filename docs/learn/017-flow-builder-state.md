# 017 Flow builder state

[Back to the docs](../README.md)

How the flow builder holds the draft an owner is editing, and how an edit, undo and save move it.

## What it is

- One zustand store, [useFlowBuilderStore.ts](../../apps/web/src/features/flow-builder/storage/hooks/useFlowBuilderStore.ts), holds the builder state for the open agent.
- The state is the draft `document` (a `FlowDocument` from `@agent-ic/flow`), its `revision`, the `selection`, the `viewport`, the undo `history { past, future }`, the `saveState` and the server's `issues`.
- `saveState` is one of `idle`, `pending`, `saving`, `conflict` and `error` ([saveState.constants.ts](../../apps/web/src/features/flow-builder/constants/saveState.constants.ts)).

## Why we have it

- The canvas, the side panel, the top bar and autosave all read the same draft. One store keeps them in step without passing props through every layer.
- Undo must work for every kind of edit. When every edit returns a whole new document, undo is only "put the previous document back".
- The backend refuses a save made from a stale revision (D233). The store must know which revision it edits and when it lost a race.

## How it works

**An edit.** Every edit is a pure function in `logic/helpers/`: it takes a `FlowDocument` and returns a new one. It never reads the clock or makes ids; the caller passes in the new ids, so tests stay exact. The container calls the edit and hands the result to `apply`.

```
apply(next)
  next is the current document -> nothing happens
  otherwise:
    past   <- past + current, keep the last HISTORY_LIMIT (50)
    future <- empty
    selection <- drop ids that no longer exist
    saveState <- pending (conflict stays conflict)
```

**Undo and redo.** `undo` moves the current document onto `future` and takes the last one from `past`; `redo` does the opposite. Both clean the selection and mark the draft `pending`, like an edit. With nothing to undo or redo, nothing changes. The helpers are in [history.helpers.ts](../../apps/web/src/features/flow-builder/storage/helpers/history.helpers.ts).

**Saving.** Autosave sets `saving`, sends the document with its revision, then calls `markSaved(revision, issues, savedDocument)`. The store takes the new revision and the issues. It goes back to `idle` only when the current document is the one that was saved; when the owner edited during the save, it stays `pending`, so the next save sends the newer edit.

**A conflict.** When the backend answers `DRAFT_CONFLICT`, the store goes to `conflict`. Edits, undo and redo keep it there, so autosave does not retry with the stale revision. Reload calls `load` with the fresh draft: it replaces the whole state and starts an empty history, so the local edits are dropped.

**The canvas model.** `documentToCanvas(document, issues)` in [canvas.helpers.ts](../../apps/web/src/features/flow-builder/logic/helpers/canvas.helpers.ts) turns the flow into plain canvas nodes: id, key, label (or the key when the label is empty), position, an in port unless the node is a trigger, the out ports from `nodePorts`, and the node's issues. The canvas in `shared/ui` draws this model and never imports `@agent-ic/flow` (ADR 0020).

## Add one

A new graph edit.

- [ ] A pure function in `logic/helpers/<topic>.helpers.ts`: a document and the ids it needs in, a new document out.
- [ ] Return the same document object when nothing changes, so `apply` records no step.
- [ ] A test of the function on a small document.
- [ ] The container calls it and passes the result to `apply`.

## Pitfalls

- **Changing the document in place.** History keeps references to old documents. A mutation changes the past too, and undo shows the wrong graph. Always build a new object.
- **Making ids inside an edit.** It makes the edit impure and the tests flaky. Take ids from the caller.
- **Calling `markSaved` without the saved document.** The store cannot tell a stale response from a fresh one, and an edit made during the save is never sent.
- **Leaving `conflict` on the next keystroke.** Only `load` leaves it. Anything else would save over someone else's draft.

Next: look at real code in the examples, starting with [the identity module](../examples/identity-module.md). The list is in [the examples section](../README.md#examples) of the docs entry page.
