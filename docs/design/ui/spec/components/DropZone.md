# DropZone
Purpose: file upload target (drop files or browse), with accepted formats caption.
Merged from: DS-Inputs (`DropZone`) and DS-Navigation (`Dropzone`; same component). States: drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
container (dashed) > `upload` `Icon` (24px, `--color-mute`) + title line ("Drop files here or <browse>", weight 600 `--type-title`, `--color-ink`) + hint (`--type-caption`, `--color-mute`; "PDF, DOCX, TXT, Markdown"). "browse" sits inside a sentence, so it is always underlined: DS-States draws it underlined (`text-underline-offset: 2px`), inheriting the title font (13/600) in `--color-accent`, hover `--color-accent-dark`. The earlier mismatch is resolved by the page.

## Variants / states (hover, drag-over, error, disabled drawn on DS-States / DS-Dark-States)
- default: border `--border-width-dash` dashed `--color-line-dash`, radius `--radius-12`, padding `--space-24`, bg `--color-card`, column centred, gap `--space-8`.
- hover: border colour `--color-edge` (stays dashed).
- drag-over: border 1.5px solid `--color-accent`, bg `--color-accent-light`, title text `--color-accent-dark` and replaced by "Drop to upload N files" (no browse link); icon and hint stay `--color-mute`.
- error: border colour `--color-err` (stays dashed); the hint is replaced by the error message in `--color-err` (12, "Price list.xlsx isn't supported — use PDF, DOCX, TXT or MD"); title and browse link unchanged.
- focus-visible: outside ring, 2px gap (`--shadow-focus-ring`) (not drawn).
- disabled: global rule (0.45, not-allowed, no hover/focus).
- uploading: not on DS-States (per-file progress lives in FileRow / Progress); UNDESIGNED for the zone itself, proposal: zone stays default while files upload.

## Props
```ts
type DropZoneProps = {
  title: string; dragTitle: (count: number) => string; browseLabel: string; hint: string; error: string | null; accept: string[]; multiple: boolean; disabled: boolean; onFiles: (files: File[]) => void;
}
```

## Accessibility
Real `input type="file"` behind a keyboard-focusable button (Enter/Space on the zone); drag events are progressive enhancement; announce accepted files via `aria-describedby` and a live region for the drop result. No Radix.

## Light/dark
Token-driven; `--color-line-dash` has a dark value in tokens.md.

## Used by
WizardFrame (Knowledge step), DS-Inputs (knowledge documents upload).

## Differs from existing
New.
