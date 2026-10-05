# NarrowScreenNotice
Purpose: full-screen message shown when the viewport is narrower than the minimum supported width of 1024px.

## Status
Decided: minimum width 1024; below it the app shows "Open on a wider screen". Inbox read-only view is the only (later) exception, so build the notice as a route-level guard that a route can opt out of. DS-Patterns > Responsive is now provided: it states only the rule and the title copy ("Minimum width 1024; narrower shows “Open on a wider screen”") and draws no notice layout, so the layout below stays an UNDESIGNED proposal.

## Anatomy
main (min-height 100vh, centred) > logo mark 28 | title | one-line body | optional action.

## Variants
Single. No dismiss.

## Props
```ts
interface NarrowScreenNoticeProps { title: string; description: string | null }
```
Copy keys: `layout.narrowScreen.title` = "Open on a wider screen" (copy confirmed on DS-Patterns); description is a proposal ("Agents needs a window at least 1024 pixels wide.").

## Tokens
bg `--color-bg`; content gap `--space-16`; title `--type-h2`; body `--type-body` `--color-mute`; logo mark as AuthFrame (28, `--color-accent`).

## Accessibility
main landmark, one h1. Shows when `(max-width: 1023px)`; a resize back above 1024 restores the app and its state (do not unmount the router state).

## Light/dark
Token-driven.

## UNDESIGNED
- Layout, illustration and body copy. Proposal: centred AuthFrame-like stack as above, no illustration.

## Used by
App root guard (all authenticated routes).

## Differs from current web
New.
