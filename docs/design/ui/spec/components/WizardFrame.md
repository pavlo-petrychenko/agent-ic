# WizardFrame
Purpose: full-screen onboarding shell: top bar with stepper, scrolling content with optional side preview panel, bottom action bar.

## Anatomy
div(flex column, 100vh) > header 72 [left slot (agent name + "New agent") | Stepper | Exit button md with `x`] | body grid [content | Panel aside 380 ("Try it as you go")] | footer 68 [Back | Skip link + primary].

## Variants
- sidePanel: boolean (content-only when false)
- layout: `split` (>= 1280, content + 380 preview) | `compact` (1024-1279): the side panel leaves the grid and moves behind a "Preview" button; the panel opens as a 320 Drawer from the right (drawn on DS-Patterns > Responsive: "wizard step · “Preview” button opens the panel as a drawer"; rule text: "wizard preview become[s a] 320 drawer"; it was a 380 drawer in v2). Below 1024 the narrow-screen notice replaces the app.
- shell: the Responsive board draws the Quick-start wizard inside the app shell: Sidebar 232 + wizard step + preview panel (about 360 at the board's 1:4 scale) at 1440, and Rail 56 + wizard step at 1024. That conflicts with the full-screen frame above (header 72 with Exit, no sidebar). OPEN: confirm whether Quick-start is a separate in-app wizard host or the same frame, and whether the docked preview is 360 or 380.
The page shows the 1208 x 900 artboard at scale .5: that is only a thumbnail, not a responsive rule.

## States
Footer primary may be disabled or loading (global rule for disabled). Skip is a standalone text link: underline on hover only. Exit asks to confirm when dirty.

## Props
```ts
interface WizardFrameProps { title: string; subtitle: string | null; steps: StepperStep[]; current: number; onExit: () => void; exitLabel: string; side: ReactNode | null; previewLabel: string; footerLeft: ReactNode; footerRight: ReactNode; children: ReactNode }
```

## Tokens
header height 72 (`--size-wizard-header-height`), padding 0 `--space-page-gutter` (28), bg `--color-panel`, border-bottom `--color-line`; side width 380 (`--size-wizard-side-width`); content padding `--space-32` `--space-48`, gap `--space-22`; side aside padding `--space-24`, border-left `--color-line`, bg `--color-panel`, gap `--space-12`; side title `--type-h3` (15/600), subtitle `--type-caption`; footer height 68 (`--size-wizard-footer-height`), border-top `--color-line`; left/right slots min-width 180; buttons: md 34, primary lg-style 40 only in AuthFrame (wizard footer buttons are md as drawn).

## Accessibility
Stepper ol with aria-current="step"; main landmark for content; the side panel is complementary; Preview drawer is a labelled non-modal region. Skip is a text button.

## Light/dark
Token-driven.

## UNDESIGNED
- Look and placement of the "Preview" button: DS-Patterns > Responsive names it but does not draw it. Proposal: secondary sm button in the header right slot before Exit. The drawer itself is drawn as a rule: 320, `--shadow-popover`, closed by ✕ or Esc (see Drawer).
- Hover and focus of the dashed drop zone and option tiles belong to their components.

## Used by
DS-Navigation (Wizard). Agent-creation flow (Template, Knowledge, Channel, Publish).

## Differs from current web
New.

## Notes (outside scope)
The sample drop zone writes "Drop files here or browse" with "browse" at rest without an underline: per the link rule an in-sentence link is always underlined (DropZone/TextLink owner to check).
