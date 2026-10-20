# 0021. Prompt drafts live in the browser

- **Status:** Accepted
- **Date:** 2026-10-16

## Context

- The design (`MVP · Prompt library`) and `mvp-scope.md` show prompts with **immutable versions plus one editable draft**: Edit opens a draft ("Editing v5 draft based on v4 · draft saved 14:20"), Discard deletes it, and Save as v5 appends a version to which pinned steps can point.
- The prompts module persisted only versions: `savePromptVersion` inserts `number = lastNumber + 1`; there is no update path for a version and no draft entity. Immutability is the safety contract for every step that pins a version.
- The agent builder keeps its draft on the server (`agent_versions.kind = draft`, revision, `DRAFT_CONFLICT`, D233), because its canvas autosaves and a different device may open it later. The prompt editor is different: it writes only when the user presses a button, so nothing between Edit and Save has to exist on the server.

## Decision

1. **The prompt draft lives in the browser**, one `localStorage` entry per prompt (`agent-ic.prompt-draft:<promptId>`), holding the draft text and the number of the version it was seeded from.
2. **Edit creates the draft** from the latest version's text (an empty text for a prompt without versions); every edit writes it back. Opening a prompt that has a stored draft opens it in edit mode with "Editing vN draft based on vM" from the local data; the design's "draft saved HH:MM" is dropped, because nothing about the draft is persisted beyond the browser. The section marks such prompts with a `draft` meta.
3. **Save is the only server write**: the dialog takes the note and calls `savePromptVersion`, which appends the next immutable version; the local draft is deleted on success. The saved number comes back from the server (the "Save as v5" label is the optimistic `latest + 1`).
4. **Discard deletes the local draft**; the latest version stays untouched.
5. The web feature owns the draft in `features/prompts/storage/`, so the UI never depends on where the draft is stored.

## Consequences

- A draft is per browser and per browser profile: it is not visible on another device, in another browser, or to another member of the workspace; clearing site data deletes it.
- Two tabs can overwrite each other's draft copy; because versions are append-only, a stale draft can only create the next version number, never overwrite a saved one — there is no conflict screen for prompts (unlike D233 for agents).
- No server-side "Test the draft" yet: a test endpoint can take the text directly from the client when it lands.
- Moving the draft to the server later (cross-device drafts, publish checks, usage) means adding a draft the way agents did in D233 and swapping the web `storage/` layer; the views and dialogs do not change.

## Alternatives considered

- **A server draft like the agent builder (D233):** rejected for now. It needs a migration, new use cases, autosave and conflict handling, and it would change the rule that nothing about a prompt reaches the server before Save. It is also the only option that would make the design's "draft saved" timestamp real.
- **Draft in memory only:** rejected. A reload or a closed tab loses the edit silently, and there would be no trace of it.
- **Editing the latest version in place:** rejected. Versions are immutable; steps pin them and published agent versions keep working only while the pinned text cannot change.
- **`sessionStorage`:** rejected. It dies with the tab, so a draft does not survive a reload after a crash or a restart, which is when losing the edit hurts most.
