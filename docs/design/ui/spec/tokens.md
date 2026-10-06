# Foundations tokens (source: DS-Foundations.dc.html, revised v2; reconciled with DS-States, DS-Patterns and every DS-Dark-* page in v3)

Page canvas 1440 wide. Fonts: Onest 400/500/600/700 (UI), JetBrains Mono 400/500 (ids, variables, code). Every value below is stated on the page unless marked ADDED (not on the page: derived or proposed) or UNDESIGNED.

## Naming and theme mechanism
Design keys are short (`C[...]`, `T[kind]`, `ACC`, `THEME`). CSS custom properties are kebab-case by category: `--color-*`, `--hue-<kind>-bg|fg`, `--type-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--size-*`, `--duration-*`, `--ease-*`, `--z-*`.
- Light values live in `:root`; dark overrides the same variables under `:root[data-theme="dark"]`. `color-scheme` is set per theme.
- Theme setting: Light, Dark, System. Per person, stored on the user. System follows `prefers-color-scheme`; apply the attribute from a script before first paint to avoid a flash. Control lives in the account menu (sidebar, top left) and in Settings > Profile (see ThemeToggle in "Components first seen here").
- Accent: teal is the only product accent (light #0F6B6B, dark #4DB6AE). Blue (#2F5BD3 / #7E9CF2) and violet (#6D4FB3 / #A98CEB) are design-tool options only, not a workspace theme: no accent-light, accent-dark or on-accent values are kept for them and none may be implemented. `--color-accent`, `-light`, `-dark`, `-on-accent` therefore have one set per theme. The widget accent (WidgetPreview, WidgetLauncher) is a customer value injected as inline `--widget-accent`, never as `--color-accent`. Implemented as two unthemed tokens in `:root`: `--widget-accent` (default teal #0F6B6B, overridden inline by the components that take an `accent` prop) and `--widget-on-accent` (#FFFFFF, the text colour on any customer accent, light and dark).
- Dark verification (DS-Dark-Foundations, -Actions, -Inputs, -Navigation, -Display, -Data, -Flow-Chat): each dark page is a 1:1 token remap of its light page (same markup; only colours and the popover/dialog shadow geometry change). Every light/dark literal pair was matched position by position against this file: all dark colour, border, shadow, scrim and overlay-line values agree with the table below; no token value changed. Literals that intentionally do NOT remap: the customer widget accent and its #FFFFFF text/avatar (WidgetPreview, WidgetLauncher, launcher shadow accent@35%), user colour swatches (ColorSwatch), and the Foundations docs swatch ring rgba(128,128,128,.35) (page chrome, no token). DS-Dark-States and DS-Dark-Patterns were checked the same way and also agree with this file, with one exception: DS-Dark-Patterns draws the widget header text, avatar fill and send icon in `--color-on-accent` #0B1F1D, against #FFFFFF on DS-Dark-Flow-Chat (decided: #FFFFFF on a customer accent, `--color-on-accent` only on the product accent; see WidgetPreview).
- Dark rules: text on accent turns dark; trigger nodes become the raised `--color-dark` (#3A3631), never near-black; hues keep identity as dark fill + light foreground; shadows use black at higher opacity; dialogs get a 1px border; scrim is black at 60%; tooltip inverts to a light bubble.

## Colour tokens (light / dark)
All values are stated on the page (the 18 step colours are in the hue table).
| var (design key) | light | dark | use |
|---|---|---|---|
| --color-bg (bg) | #F4F2EE | #151412 | page background |
| --color-panel (panel) | #FBFAF8 | #1B1A17 | panes, sidebars, footers |
| --color-card (card) | #FFFFFF | #211F1C | cards, inputs, tables, menus |
| --color-soft (soft) | #F1EFEA | #2A2824 | hover, neutral badge, meters |
| --color-chip (chip) | #EDE9E2 | #322F2A | selected nav item |
| --color-line (line) | #E3DFD8 | #34312C | borders |
| --color-line-row (line2) | #EFECE6 | #2A2824 | row dividers |
| --color-line-node (line3) | #E1DCD3 | #3A3631 | node borders |
| --color-line-dash (dash) | #CFC9BF | #4A463F | dashed add/empty, switch off track, checkbox and radio border, idle status dot, tab hover preview, `--chart-muted` |
| --color-edge (edge) | #9C958A | #7A746A | canvas edges and idle ports; hover border of fields (input, select, select button, search, textarea), checkbox and radio; switch off-hover track; hover border of dashed AddTile, FilterChip, DropZone (DS-States); chart crosshair |
| --color-grid (grid) | #D9D4CB | #2B2925 | canvas dot grid |
| --color-ink (ink) | #1F1D1A | #ECE8E1 | primary text |
| --color-ink-secondary (ink2) | #3B3833 | #CFCAC1 | secondary text |
| --color-mute (mute) | #5E5A53 | #A29C92 | meta, labels |
| --color-disabled (disabled) | #A39E95 | #6F6A62 | disabled text where a colour is needed (components otherwise use the 45% opacity rule) |
| --color-accent (accent) | #0F6B6B | #4DB6AE | primary actions, focus, selection |
| --color-accent-light (accL) | #E3F0EF | #16302E | selected rows, info fill, accent-tinted avatar |
| --color-accent-dark (accD) | #0A4F4F | #86D4CC | accent hover, text on accent-light |
| --color-on-accent (onAcc) | #FFFFFF | #0B1F1D | text and icons on accent |
| --color-accent-glow (accGlow) | rgba(15,107,107,.14) | rgba(77,182,174,.24) | field focus halo, selected halo |
| --color-dark (dark) | #2A2723 | #3A3631 | trigger nodes, dark badge |
| --color-on-dark (onDark) | #FFFFFF | #F2EEE7 | text on dark |
| --color-on-dark-secondary (darkInk) | #D8D3CA | #CFCAC1 | secondary text on dark |
| --color-ok (ok) | #1C6E4C | #6FCB9C | success text |
| --color-ok-light (okL) | #E2F1EA | #16291F | success fill |
| --color-ok-dot (okDot) | #2F8A5B | #4CB884 | status dot, success |
| --color-ok-line (okLine) | #BFDCCB | #2F5A44 | done run-node border |
| --color-ok-on-dark (okOnDark) | #8FD3AE | #6FCB9C | check on a trigger node |
| --color-warn (warn) | #6B4A00 | #E3B25C | warning text |
| --color-warn-light (warnL) | #FBF3DE | #2E2615 | warning fill |
| --color-warn-ink (warnInk) | #5B4A1C | #E8C987 | text in warning callouts |
| --color-warn-dot (warnDot) | #C27B1A | #D9963A | status dot, warning |
| --color-err (err) | #A53428 | #F08A7C | error text, danger, error dot |
| --color-err-light (errL) | #F7E4E1 | #351D19 | error fill, error field halo |
| --color-err-ink (errInk) | #6E2219 | #F5B3A9 | text in error callouts |
| --color-err-line (errLine) | #E8C4BE | #6B302A | danger button border |
| --color-violet (violet) | #5E43A8 | #B9A6F0 | agent output, scores, observer tags |
| --color-violet-light (violetL) | #ECE7F6 | #2A2340 | violet fill |
| --color-code-bg (codeBg) | #1F1D1A | #0E0D0C | code editor |
| --color-code-fg (codeInk) | #E8E4DC | #E8E4DC | code text |
| --color-avatar-bg (avBg) | #E6E1D8 | #34312C | neutral avatar fill |
| --color-tooltip-bg (tipBg) | #1F1D1A | #ECE8E1 | tooltip (inverts in dark) |
| --color-tooltip-fg (tipInk) | #FFFFFF | #1A1816 | tooltip text |
| --color-hairline (hairline) | rgba(0,0,0,.08) | rgba(255,255,255,.10) | inset border on swatches and images |
| --color-overlay-line (ovLine) | transparent | #3A3631 | 1px border on dialogs (dark only) |
| --overlay-backdrop (scrim) | rgba(31,29,26,.38) | rgba(0,0,0,.6) | backdrop behind dialogs |
Status dots (6 to 8px) are brighter than ok/warn text on purpose: text needs 4.5:1, a 6px dot only needs 3:1 on every surface. Dot colours: ok-dot, warn-dot, err, dash, accent. Avatar accent tint = accent-light on accent-dark (`avatar.owner`); the old #D4E6E4 is removed.
Page chrome (docs only, no token): label text uses ink/mute/accent-dark.

## Node and resource hues (18 kinds; `--hue-<kind>-bg` / `--hue-<kind>-fg`)
Tile 28x28, radius 8, icon 14-15 inside. Each kind keeps one hue everywhere (canvas, palette, traces, timeline bars, tags). Dark keeps hue: dark fill + light foreground.
| kind | label | icon | light bg / fg | dark bg / fg |
|---|---|---|---|---|
| trig | Trigger | msg | #2A2723 / #FFFFFF | #3A3631 / #F2EEE7 |
| agent | Agent | agent | #ECE7F6 / #5E43A8 | #2A2340 / #B9A6F0 |
| compl | Completion | compl | #E6EEF8 / #2B5E9E | #1C2838 / #8DB4E8 |
| router | Router | router | #F5ECDF / #8E5410 | #33261A / #E0A86A |
| par | Parallel | par | #E9F0E1 / #4A6A2B | #212A1A / #A8C98A |
| wait | Wait | wait | #EEECE7 / #5F5A4E | #2A2824 / #BDB6A8 |
| send | Send message | send | #E2F1EA / #1C6E4C | #16291F / #6FCB9C |
| api | API request | api | #E4EEF3 / #23617A | #18272E / #7EBBD3 |
| kb | Knowledge | kb | #F1E8E1 / #74492E | #2E241D / #D6A887 |
| tool | Tool | tool | #F6E6EB / #983A56 | #33202A / #E393AC |
| var | Set variable | var | #EAECEF / #4E5763 | #24272C / #AEB6C2 |
| esc | Escalation | esc | #F7E4E1 / #A53428 | #351D19 / #F08A7C |
| gen | Generation | sparkle | #ECE7F6 / #5E43A8 | #2A2340 / #B9A6F0 |
| neutral | Neutral | box | #F1EFEA / #3B3833 | #2A2824 / #CFCAC1 |
| info | Info | info | #E3F0EF / #0A4F4F | #16302E / #86D4CC |
| ok | Success | check | #E2F1EA / #1C6E4C | #16291F / #6FCB9C |
| warn | Warning | alert | #FBF3DE / #6B4A00 | #2E2615 / #E3B25C |
| err | Error | alert | #F7E4E1 / #A53428 | #351D19 / #F08A7C |
Status hues (ok/warn/err/info/neutral) equal the status colour pairs; agent = gen = violet, esc = err, send = ok. The design's ad hoc tints rose/blue/teal/brown/amber/green are the hues tool/compl/api/kb/router/par; specs use hue names only.

## Typography
Font stacks: `--font-sans: 'Onest', 'Segoe UI', system-ui, sans-serif`; `--font-mono: 'JetBrains Mono', ui-monospace, monospace`. Line height 1.4 base on page (body 13px/1.4); samples show no per-style line-height, use 1.4 (matches tokens.css). Page uses non-variable Google Fonts; repo uses Variable fonts (fine).
| var | size/weight | letter-spacing | use |
|---|---|---|---|
| --type-display | 24/600 | -0.01em | wizard step titles |
| --type-h1 | 22/600 | -0.01em | page and pane titles |
| --type-h1-mono (NEW) | 21/500 mono | none shown | page title that is a code id |
| --type-h2 | 18/600 | none | inspector, dialog titles |
| --type-h3 | 15/600 | none | card and section titles |
| --type-lead | 14/400 | none | intro under Display |
| --type-title | 13/600 | none | card headers, list titles |
| --type-body | 13/400 | none | default text |
| --type-body-small | 12.5/400 | none | table cells, descriptions |
| --type-caption | 12/400 (mute colour) | none | meta, help text |
| --type-small | 11.5/400 (mute) | none | secondary meta |
| --type-overline | 11/600 uppercase | 0.06em | group labels |
| --type-mono | 12/400 mono | none | ids, variables, code |
| --type-micro | 10.5/600 | 0.04em | canvas labels, chart axes, run state |
Page now names letter-spacing and line-height tokens (see Type tokens below).

### Typography additions (ADDED, proposed; used by component specs)
Existing `--type-*` are font shorthands (`--type-h1-mono` is 500 21px/1.4 mono). New shorthands (ADDED) follow the same form (`weight size/line-height family`):
| var | value | needed by |
|---|---|---|
| --type-mono-xs | 400 11px/1.4 mono | Badge mono, Tag mono, EdgeLabel, NodeOutput, IconRow trailing, SubnavItem version, Timeline ticks |
| --type-mono-sm | 400 11.5px/1.4 mono | RunRow, TraceRow, KeyValue PropRow, CodeBlock light |
| --type-mono-lg | 400 12.5px/1.4 mono | Input mono, CodeBlock dark |
| --type-hint | 400 11px/1.4 sans | Menu hint, Metric label, SelectButton context, Inspector note, chart axis |
| --type-caption-strong | 600 12px/1.4 sans | Inspector section title, TextLink, ghost Button, ListGroup action |
| --type-body-small-strong | 600 12.5px/1.4 sans | text button, user name, StatusBar action, ghost Button link |
| --type-lead-strong | 600 14px/1.4 sans | PaneHeader title, Identity name (md) |
| --type-button-lg | 600 13.5px/1.4 sans | Button lg, AuthFrame CTA |
Tracking and leading tokens are in "Type tokens" below (old snug 1.45 = relaxed 1.45; 1.6 and 1.7 dropped). Letter-spacing is applied beside the font shorthand (`font: var(--type-h1); letter-spacing: var(--tracking-tight)`).

## Radii
4, 6 (tiles 22, tags), 8 (controls, 28px hue tiles), 10 (callouts), 12 (cards, nodes), 14 (bubbles), 16 (dialogs), 999 (pills). `--radius-4|6|8|10|12|14|16|pill`; `--radius-5` (Tag, NodeOutput) is component-local, ADDED. Bubble tail corner uses 4.

## Focus, selection, disabled
Two focus rules: fields, and everything else. Selection is a state, not focus.
| case | rule | tokens |
|---|---|---|
| Field focus (input, textarea, select, search, prompt editor) | border 1px accent + 3px soft halo | `border-color: var(--color-accent); box-shadow: var(--shadow-focus-field)` = `0 0 0 3px var(--color-accent-glow)` |
| Field error (+ focus) | border stays err; halo uses error fill | `border-color: var(--color-err); box-shadow: 0 0 0 3px var(--color-err-light)` (`--shadow-focus-field-error`) |
| Everything else (button, icon button, chip, tab, nav and list rows, tile, switch, swatch) | ring outside, 2px gap in the surface colour | `--shadow-focus-ring: 0 0 0 2px var(--color-card), 0 0 0 4px var(--color-accent)` |
| Rows inside a list or table | same ring drawn inset so it is not clipped | `--shadow-focus-ring-inset: inset 0 0 0 2px var(--color-accent)` |
| Selected card, option, node | 2px accent border + 4px halo | `border: var(--border-width-strong) solid var(--color-accent); box-shadow: var(--shadow-selected)` = `0 0 0 4px var(--color-accent-glow)` |
| Disabled (every component) | normal colours and layout at 45% opacity; no hover, no focus, `cursor: not-allowed`, `pointer-events: none`; a Tooltip explains why when not obvious | `--opacity-disabled: .45` |
Focus is `:focus-visible` only. The ring gap colour is `--color-card` (ADDED note: on `--color-panel`/`--color-bg` surfaces the gap still reads correctly; keep card, as drawn).
Per-component applications drawn on DS-States: Menu and listbox options take keyboard focus as the hover style (bg `--color-soft`, one active option, no ring), because focus stays on the list (aria-activedescendant); SegmentedControl and ThemeToggle options use the inset ring; Tabs use the outside ring with radius 4; sidebar NavItem, ListItem, SubnavItem and record rows use the inset ring; Rail items use the outside ring. Hover is drawn too: rows and ghost controls `--color-soft`, fields and dashed affordances `--color-edge` border, primary actions `--color-accent-dark`; pressed = hover colour, except secondary and AddTile, which use `--color-chip`.

## Elevation (per theme)
| var | light | dark | use |
|---|---|---|---|
| (none) | 1px `--color-line` border only | same | cards |
| --shadow-node | 0 1px 2px rgba(31,29,26,.06) | 0 1px 2px rgba(0,0,0,.45) | nodes |
| --shadow-popover | 0 10px 28px rgba(31,29,26,.14) | 0 12px 32px rgba(0,0,0,.55) | menus, popovers |
| --shadow-dialog | 0 24px 60px rgba(31,29,26,.3) | 0 24px 64px rgba(0,0,0,.65) | dialogs |
| --shadow-tooltip | 0 4px 12px rgba(31,29,26,.15) | 0 4px 12px rgba(0,0,0,.5) | tooltip, chart tooltip |
| --shadow-swatch-inset | inset 0 0 0 1px var(--color-hairline) | same token | swatches, images |
Scrim: `--overlay-backdrop` (table above). Dark dialogs add `border: 1px solid var(--color-overlay-line)`.

## Control sizes and layout
| token | value | used by |
|---|---|---|
| --size-control-xs | 22 | inline text actions (ghost button, link-style) |
| --size-control-sm | 28 | small buttons (was 30), icon buttons sm, filter chips, small selects, hue tile md, avatar-adjacent controls |
| --size-control-md | 34 | default buttons, inputs, selects, search, icon button md |
| --size-control-lg | 40 | auth and wizard primary actions, large inputs |
| --size-tile-xs/sm/md/lg | 18 / 22 / 28 / 34 | NodeTile |
| --size-avatar-sm/md/lg | 24 / 32 / 40 | Avatar |
| --size-sidebar-width | 232 | app sidebar, expanded |
| --size-rail-width | 56 | collapsed sidebar; flow builder |
| --size-topbar-height | 56 | flow builder top bar |
| --size-pane-header-height | 48 (panel headers), 64 (chat header) | PaneHeader |
| --size-secondary-nav-width | 240 | Settings, Knowledge, Channels, Prompts lists |
| --size-inspector-width | 320 | flow inspector, Inbox details |
| --size-palette-width | 232 | flow builder palette |
| --space-page-gutter | 28 | page side padding |
| --size-dialog-width-sm/md/lg/xl | 560 / 640 / 720 / 920 | confirmations / forms / publish / two-pane pickers (replaces repo `--size-dialog-width` 440) |
| --size-auth-card-md/lg | 400 / 460 | logged-out cards |
Not drawn on this page (values kept from component pages, unchanged; names added in the consolidation pass so every spec resolves):
| token | value | used by |
|---|---|---|
| --size-switch-width / -height / -thumb | 34 / 20 / 16 | Switch (thumb fill `--color-card` in both themes, drawn on DS-Dark-Inputs) |
| --size-checkbox | 16 | Checkbox, Radio |
| --size-step-circle | 26 | Stepper |
| --size-statusbar-height | 44 | StatusBar |
| --size-wizard-header-height / -footer-height / -side-width | 72 / 68 / 380 | WizardFrame (docked preview at >= 1280; the DS-Patterns board draws about 360: OPEN). The compact wizard preview Drawer is 320 (`--size-inspector-width`), not this token |
| --size-menu-width | 280 | Menu, PromptEditor variable menu |
| --size-rail-item-width / -height | 40 / 36 | Rail, NavItem (rail layout) |
| --size-row-sm | 30 | PaletteItem, TreeFolder rows (list rows, not controls) |
| --size-dot-sm / -md | 6 / 8 | Badge dot, Legend, StatusDot, StatusBar |
| --size-bar-sm / -md | 4 / 8 | Progress, Meter |
| --layout-lead-width | 620 (the Display page lead sample uses 760: OPEN) | DisplayTitle |
`--size-control-compact` (30) is REMOVED: use `--size-control-sm` (28). There is no `--size-header-height`; use `--size-topbar-height` (56) or `--size-pane-header-height`.

## Borders, indicators, dots
| token | value | used by |
|---|---|---|
| --border-width | 1px solid `--color-line` | cards, inputs, tables, menus |
| --border-width-dash | 1.5px dashed `--color-line-dash` | add tile, drop zone, empty slots (filter chip uses 1px dashed) |
| --border-width-strong | 2px | indicators and selection |
| indicator | 2px `--color-accent` | tab underline, selected row / nav bar (inset left), timeline cursor |
| selection | 2px accent + 4px glow halo | selected card, option, node |
| focus ring | 2px gap + 2px accent | see Focus |
| status dot | 6 to 8px | okDot / warnDot / err / dash / accent |

## Links
Standalone action links (cards, headers, callouts, tables): accent colour, no underline at rest, underline on hover, focus ring. Links inside sentences: always underlined (colour must not be the only cue). Hover colour `--color-accent-dark`.

## Type tokens
Scale in the Typography section. Letter-spacing and line-height tokens named by the page:
| var | value | used by |
|---|---|---|
| --tracking-tight | -0.01em | Display, H1 |
| --tracking-micro | 0.04em | micro (canvas labels, axes) |
| --tracking-overline | 0.06em | overline (uppercase group labels) |
| --leading-base | 1.4 | all UI text |
| --leading-relaxed | 1.45 | multi-line: descriptions, inputs, code, bubbles, help (replaces proposed --leading-snug) |
| --leading-tight | 1.2 | two-line identity blocks (name + meta) |
| --type-h1-mono | 21/500 mono | page title that is a code id |
Old proposals `--leading-snug` 1.45 and `--leading-loose` 1.7 / relaxed 1.6: the page defines only 1.2, 1.4, 1.45; code and PromptEditor use 1.45 (component specs that cite 1.6/1.7 should adopt `--leading-relaxed`, see notes). OPEN against this: DS-States draws the PromptEditor surface in JetBrains Mono 13 at line-height 1.7, and the Dialog title at 18/600 with letter-spacing -0.01em (`--type-h2` has no tracking). Neither is adopted until confirmed (INDEX section 7).

## Motion
| var | value | used by |
|---|---|---|
| --duration-fast | 120ms | hover, press, colour changes, switches, checkbox |
| --duration-base | 200ms | menus, popovers, tooltips, tab indicator, accordion rows |
| --duration-slow | 320ms | dialogs, drawers, inspector open, toasts |
| --duration-pulse | 1200ms | StatusDot run halo (DS-States), typing dots (DS-Patterns); Skeleton pulse if one is added (proposal) |
| --ease-standard | cubic-bezier(.2, 0, 0, 1) | things that move on screen |
| --ease-enter | cubic-bezier(0, 0, .2, 1) | appearing: menus, dialogs, toasts |
| --ease-exit | cubic-bezier(.4, 0, 1, 1) | leaving; use about 80% of the enter duration |
Reduced motion (`prefers-reduced-motion`): opacity only, no movement, fades at most 120ms; spinners keep turning; pulses and the indeterminate Progress stop (static). `--duration-pulse` 1200ms is now drawn twice: the StatusDot run halo pulses at 1.2s (DS-States) and the typing dots "pulse in sequence, 1.2s" (DS-Patterns). Still UNDESIGNED: Skeleton animation (proposal: opacity pulse at `--duration-pulse`) and spinner speed (proposal 800ms per turn, linear).
Timing constants drawn on DS-Patterns (component-local, not tokens): skeleton delay 300ms (show only if loading takes longer); toast auto-hide 4000ms, 8000ms with an action, errors sticky; typing indicator max 30000ms; canvas zoom 25–200%.
Timing constants drawn on DS-States (component-local, not tokens): Tooltip opens after 400ms on hover and focus (was a 300ms proposal), hides 100ms after pointer leave, offset 8px, arrow 8px; Progress indeterminate segment 35% wide, 1.4s per pass, `linear` timing keyword (no ease token needed).

## Z-index
| var | value | contents |
|---|---|---|
| --z-base | 0 | page, canvas, nodes |
| --z-raised | 10 | sticky table headers, canvas toolbars, status bar |
| --z-nav | 20 | sidebar, rail, top bar |
| --z-dropdown | 100 | menus, selects, autocomplete |
| --z-popover | 200 | popovers, account menu, chart tooltips |
| --z-drawer | 300 | inspector overlay at compact widths |
| --z-scrim | 400 | dialog backdrop |
| --z-dialog | 410 | dialogs |
| --z-toast | 500 | toasts, alerts |
| --z-tooltip | 600 | tooltips, always on top |

## Breakpoints
Minimum supported width 1024. Drawn on DS-Patterns > Layout > Responsive (schematic boards plus rule text; see components/AppShell.md): below 1280 the user can pin the Sidebar open and it then overlays; Inspector, Inbox details and wizard preview all become 320 drawers (the wizard preview is no longer 380 as a drawer) with `--shadow-popover`, closed by ✕ or Esc; tables keep their first column and hide low-priority columns before scrolling horizontally; the flow builder uses the Rail at every width and keeps the 232 palette.
| name | width | layout |
|---|---|---|
| wide | >= 1440 | as designed: sidebar 232, all panes visible |
| default | 1280-1439 | content column shrinks; inspector and details stay 320 |
| compact | 1024-1279 | sidebar collapses to the 56 rail (pin-open overlays); flow inspector, Inbox details ("Details" button in the chat header) and wizard preview ("Preview" button) become 320 drawers over the content |
| unsupported | < 1024 | full-screen notice "Open on a wider screen"; Inbox read-only view is the only (later) exception |
Media queries: `(min-width: 1440px)`, `(max-width: 1279px)`, `(max-width: 1023px)`.

## Spacing
2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 28, 32, 48 px (`--space-N`). Page gutter 28, card padding 14-18, control gap 8, section gap 14-22. Also used by component specs and not on this page (ADDED): `--space-3`, `-5`, `-7`, `-9`, `-11`, `-24`.

## Chart palette
Drawn on DS-Patterns > Charts (token table) and DS-Dark-Patterns; replaces the v2 proposal (`--chart-2` violet, `-3` ok, `-4` warn, `-5` err), and there is no `--chart-5`.
| var (design key) | light | dark | use |
|---|---|---|---|
| --chart-1 (chart.1) | #0F6B6B (= accent) | #4DB6AE (= accent) | first series, single-series bars, meters |
| --chart-2 (chart.2) | #2B5E9E (= `--hue-compl-fg`) | #8DB4E8 | second series |
| --chart-3 (chart.3) | #8E5410 (= `--hue-router-fg`) | #E0A86A | third series |
| --chart-4 (chart.4) | #5E43A8 (= `--color-violet`) | #B9A6F0 | fourth series |
| --chart-muted (chart.muted) | #CFC9BF (= `--color-line-dash`) | #4A463F | hidden series in the legend, "Other" |
Define them as aliases of the existing tokens (`--chart-1: var(--color-accent)` and so on), not new raw values. Gridlines `--color-line-row`; axis text 11 (`--type-hint`) in `--color-mute`; hover crosshair 1px `--color-edge` dashed 3 3; series markers r 4.5 with a 2px `--color-card` ring; legend swatch 12x3 radius 2 (component-local). Note: `bar_x` is only a helper returning a bar's x position, not a chart; horizontal bars are the Meter component.

## Icons
Custom inline SVG set, `svg(name, size, stroke)`: 16px grid (`viewBox="0 0 16 16"`), stroke 1.5 (header logo tile uses 1.8 at 15), `fill="none"`, `stroke="currentColor"`, round caps and joins, `aria-hidden="true"`. Sizes 11-18 (hue tiles 14-15 inside 28; the icon grid shows 18). Outline style, not Lucide/Feather.
Identification: every `<svg>` in the markup carries `data-icon="<name>"` (kebab-case, exactly the names below). Because exported SVG paths get stripped, `data-icon` is the key: the Icon component maps `name` to a path set, and tooling finds icons by this attribute.
Names (61, alphabetical as on the page): agent, alert, api, arrow-down, arrow-up, bolt, box, cal, channels, chart, check, chevron-down, chevron-right, code, compl, copy, drag, esc, filter, flask, gear, hand, home, hour, image, inbox, info, kb, key, keyboard, link, lock, logo, minus, monitor, moon, more, msg, note, panel, par, pause, play, plus, refresh, router, search, send, sort, sparkle, spinner, star, sun, tool, tool-event, traces, upload, user, var, wait, x.
Renames: toolev -> tool-event, chev -> chevron-down, chevr -> chevron-right, kbd -> keyboard. New over the previous 53: moon, monitor, spinner, sort, arrow-up, arrow-down, image, copy.
Paths of the new theme icons (16 grid, stroke 1.5): moon `M13.5 9.8A5.8 5.8 0 0 1 6.2 2.5 5.8 5.8 0 1 0 13.5 9.8z`; monitor `rect x1.5 y2.5 w13 h9 rx1.5` + `M5.5 14h5M8 11.5V14`; spinner `M8 1.75a6.25 6.25 0 1 1-6.25 6.25` (open arc; rotate it, steady under reduced motion); sort `M5 6.5L8 3.5l3 3M5 9.5l3 3 3-3`; sun: circle r3 + eight rays. Other path data is read from the page SVGs by `data-icon`.
Default icon per hue: see hue table.


## Components first seen on this page (specs in components/)
Icon, Badge (status pill with dot, tag pill, avatar-name pill), Callout, NodeTile, AttentionCard, ThemeToggle (not drawn on this page, only its icons sun/moon/monitor; the control is drawn on DS-Patterns > Theme, see components/ThemeToggle.md). The dark panel also shows ChatBubble, Switch, SegmentedControl, Checkbox, Field, Button and Card; those belong to other pages' agents.

## Name decisions
- Tooltip text is `--color-tooltip-fg`; text on `--color-dark` is `--color-on-dark` / `--color-on-dark-secondary`; error-link text is `--color-err-ink`; danger border `--color-err-line`; neutral avatar fill `--color-avatar-bg`.
- NOT tokens: `--size-control-compact`, `--size-control-xl`, `--size-tab-height`, `--border-width-tab`, `--border-width-selected`, `--color-rose*`, `--color-blue*`, `--leading-snug`, `--leading-loose`, accent alternatives for blue and violet.
- Component-local constants (not tokens): FlowCanvas grid 20px and dot 1px on `--color-bg` (decided; the DS-Patterns boards draw 18px as frames), edge widths 1.5/2px (DS-Patterns adds 2.5px for a selected edge), port sizes 8/12px, chart bar top radius 4px (drawn as path Q 4 on DS-Data and DS-Dark-Data; was listed as 3px) and line width 2px, RunNode radius 9px and opacities, WidgetPreview/WidgetLauncher shadows, Textarea min-height 72px, AddTile min-height 120px, KeyValue label columns 110/124px.
- Repo tokens.css currently has no dark values and lacks most tokens listed here (disabled, on-dark, tooltip, ink variants, dots, glow, hairline, hue set, z-index, ease, durations beyond fast); this file is the full target.
