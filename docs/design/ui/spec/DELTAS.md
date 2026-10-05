# v3 deltas for built components (layer 0 and layer 1)

This page lists the concrete changes for everything already built in layer 0 and layer 1 (INDEX section 3). The changes come from DS-States, DS-Patterns and the DS-Dark-* pages, after the reconciliation recorded in INDEX section 1. The full target for each component is its spec in [components/](components/); this page is the diff against v2. The source of each change is in brackets: [States], [Patterns] or [Dark].

How to apply:
- One small pull request per component, owned by the lane that built it. Each changed behaviour gets a test that fails without the change, and each story gets the new states (rule 18).
- Tokens only in scss. Component-local numbers (delays, sizes that have no token) go in `<Name>.constants.ts`. No comments in code.
- Cross-lane imports are allowed in this pass only to an export whose API this pass does not change: Dialog may import Callout, and Tabs may import Badge. ThemeToggle imports Tooltip only after lane 3 merges the Tooltip change.
- "No change" means the v3 pages confirm the v2 spec. Re-check the story in dark only where a note says so.
- Common hover and pressed rules used below (tokens.md, Focus section): rows and ghost controls hover to `--color-soft`; fields and dashed affordances hover to a `--color-edge` border; pressed uses the hover colour, except secondary and AddTile, which use `--color-chip`.

## Layer 0 (single owner)

### tokens.css
- Add `--duration-pulse: 1200ms` (now drawn: StatusDot run halo [States], typing dots [Patterns]).
- Add the chart aliases. Light and dark follow automatically, because they point at tokens that already have dark values:
  - `--chart-1: var(--color-accent)`
  - `--chart-2: var(--hue-compl-fg)`
  - `--chart-3: var(--hue-router-fg)`
  - `--chart-4: var(--color-violet)`
  - `--chart-muted: var(--color-line-dash)`
  If v2 proposal values exist (`--chart-2` violet, `-3` ok, `-4` warn, `-5` err), replace them and delete `--chart-5` [Patterns].
- Verify, without changing any value: the dark `--shadow-popover` (0 12px 32px rgba(0,0,0,.55)), `--shadow-tooltip` (0 4px 12px rgba(0,0,0,.5)), `--shadow-dialog` (0 24px 64px rgba(0,0,0,.65)) and `--shadow-focus-field-error`. All seven dark pages, DS-Dark-States and DS-Dark-Patterns match tokens.md, so no colour value changes [Dark].
- `--size-wizard-side-width` stays 380, but only for the docked wizard preview. Drawers use `--size-inspector-width` 320.
- Not tokens; these go in component constants: Tooltip delay 400 and hide 100, Progress indeterminate 1400ms, skeleton delay 300, toast durations 4000 and 8000, chart bar radius 4 (was listed as 3; DS-Data and DS-Dark-Data draw Q 4).

### Theme store
No change.

### ThemeToggle (lands after lane 3's Tooltip pull request)
- Replace the v2 radiogroup with the drawn group [Patterns]:
  - Root: `role="group"` with `aria-label`; inline-flex; 1px `--color-line` border; radius `--radius-8`; `overflow: hidden`; bg `--color-card`.
  - Three `aria-pressed` buttons with no border, radius or dividers.
- Add `variant: ThemeToggleVariant` (`menu` | `settings`) and `labels: Record<ThemePreference, string>`:
  - `menu`: icons only (`sun`, `moon`, `monitor`, 11px, stroke 1.5); padding `--space-4` `--space-7`. Each button has `aria-label={labels[x]}` and is wrapped in `Tooltip`.
  - `settings`: text only, `--type-caption` 12, padding `--space-6` `--space-11`. The Field-style label "Theme" and the help text are composed by the Settings screen, not rendered by the toggle.
- States:
  - selected: bg `--color-chip`, `--color-ink`, weight 600.
  - rest: transparent, `--color-mute`, weight 400.
  - hover (unselected): bg `--color-soft`, ink.
  - focus-visible: `--shadow-focus-ring-inset` on the button.
  - disabled: the whole group at `--opacity-disabled`.
- Keyboard: arrow keys move within the group (Radix ToggleGroup type single, guarding the empty value). Inside the account menu row it must not hand arrows to the Menu.
- Heights stay as the padding produces them (about 25 and 31). The 28 rule is OPEN (INDEX section 7, item 14).
- Tests: the pressed state follows `value`; `onChange` fires on click and arrows; the menu variant renders the aria-labels and the tooltip text.

### Icon
No change. Every icon used by the v3 states and patterns is already in the 61-icon set.

## Lane 1: AddTile, Button, Dialog, IconButton, SegmentedControl, TextLink, Toast

### AddTile [States]
- hover: bg `--color-soft`, border colour `--color-edge` (stays 1.5px dashed), text `--color-ink`.
- active: bg `--color-chip`, border `--color-edge`.
- Focus ring radius follows `--radius-12`.

### Button [States]
- `:active` colours:
  - primary: bg `--color-accent-dark`
  - secondary: bg `--color-chip`
  - danger: bg `--color-err-light`
  - ghost: text `--color-accent-dark`, no underline
  - No transform or scale on any variant.
- Loading:
  - Render `Icon spinner` 13px, stroke 1.8, inside a wrapper at opacity .9, before the label. It replaces the leading icon when there is one.
  - Keep the label, the width and the variant colours (no dimming).
  - Set `cursor: progress`, `aria-busy="true"` and block clicks.
- Ghost has no loading look: drop `loading` for ghost at the type level, or ignore it with a test.
- Label weight is unchanged (OPEN, item 15).

### Dialog [States, Dark]
- Add `busy: boolean`:
  - Cancel and the close IconButton get `disabled` (global .45).
  - Escape and scrim click do nothing (`onEscapeKeyDown` and `onPointerDownOutside` call preventDefault).
  - The caller passes `loading` to the primary Button ("Pausing…").
- Add `error: string | null`:
  - Render a `Callout` tone err (icon `alert` 14) as the first child of the body, then a `--space-10` gap, then the body.
  - The dialog stays open. The caller relabels the primary to the retry ("Try again").
- Destructive confirm: no Dialog code change. Add a story and docs for Button danger (outlined) as the confirm, with a title that names the object.
- Spacing is unchanged: keep header and body `--space-18` `--space-22`, footer `--space-14` `--space-22`, close md 34. DS-States draws 16 20 / 12 20 / 28 (OPEN, item 11).
- Dark is confirmed: border `--color-overlay-line`, shadow and scrim per theme. No change.

### IconButton [States]
- Add `IconButtonSize.Xs` (22, `--size-control-xs`, icon 14), ghost only. It is used by the SearchInput clear button and the PasswordInput toggle.
- Add `loading: boolean`: swap the icon for `spinner` at the same size, keep the colours (no dimming), set `aria-busy`, block clicks. It is drawn on the Composer send button.
- Ghost hover is confirmed (bg `--color-soft`, icon `--color-ink`); verify only.
- Active and danger are still UNDESIGNED. No change.

### SegmentedControl [States]
- Unselected option hover: bg `--color-soft`, text `--color-ink`.
- Option focus-visible: `--shadow-focus-ring-inset` on the option, text `--color-ink`. Replace any outside ring.
- Add group-level `disabled: boolean`: the whole group at `--opacity-disabled`, not-allowed, no hover or focus. Per-option `disabled` stays.
- Sizes are unchanged (OPEN, item 14).

### TextLink
No change. Composer's "Retry" uses the existing err tone.

### Toast [Patterns, Dark]
- Surface:
  - Card bg, 1px `--color-line`, radius `--radius-10`, `--shadow-popover`, width 360.
  - Padding `--space-10` `--space-12`, flex with gap `--space-10`.
  - Same surface for every tone: remove any tone fill or tone border.
- Content:
  - Tone icon 16 with no tile: ok `check` in `--color-ok-dot`; info `info` in `--color-accent`; err `alert` in `--color-err`.
  - Message `--type-body` `--color-ink`.
  - Optional action: a 22-high text button, 12.5/600 `--color-accent`, underline on hover.
  - Dismiss: IconButton ghost sm 28 with `x` 14 in `--color-mute`, labelled "Dismiss".
  - One line, no title.
- Viewport: bottom-left, `--space-16` from the bottom and left edges, newest on top, at most 3 visible (a 4th removes the oldest). Stack gap `--space-8` (proposal).
- Timing:
  - ok or info without an action: 4000ms.
  - Any toast with an action: 8000ms.
  - err: sticky (`durationMs: null`).
  - The timer pauses on hover and while focus is inside.
- Roles: `role="status"` for ok and info, `role="alert"` for err.
- Props: `ToastTone` becomes `info | ok | err`; add `action: { label; onClick } | null` and `durationMs: number | null`.
- Constants go in `Toast.constants.ts`.
- Keep the existing export.

## Lane 2: Checkbox, Field, FilterChip, Input, Radio, Select, Switch, Textarea, VariableChip

### Checkbox [States, Patterns]
- Box border: 1px becomes 1.5px solid `--color-line-dash` (`box-sizing: border-box`, 16, radius `--radius-4`).
- Unchecked hover: border `--color-edge`.
- Check icon stroke 2.2 (11px, `--color-on-accent`).
- Add indeterminate: same fill as checked with `minus` 11, stroke 2.2, `--color-on-accent`. `checked` becomes `boolean | 'indeterminate'`, mapped to Radix `checked="indeterminate"`.
- The whole label row is the hit area.
- Error is still UNDESIGNED. Keep `invalid` as a pass-through, with no new visual.

### Field
No change.

### FilterChip [States, Patterns]
- Empty and not-applied hover: bg `--color-soft`, border colour `--color-edge` (stays 1px dashed).
- Add `open: boolean`. When open and not applied: bg `--color-soft`, border 1px solid `--color-edge`, `aria-expanded="true"`.
- Applied hover: border `--color-accent-dark`; bg stays `--color-accent-light`.
- Clear target:
  - The `x` (10px, stroke 1.8) sits in a 16px circle.
  - On hover the circle fills with `--color-accent-dark` and the icon turns `--color-accent-light`.
  - Give the button a 24px hit area (for example padding or a pseudo-element) without changing the 28 pill height.
- Add `extraCount: number`. When greater than 0 the bold value reads "first value +N" ("Telegram +1").
- Applied and open together is still UNDESIGNED: keep the applied look.
- The picker is not built here. `FilterPicker` is built with FilterBar in layer 3.

### Input [States]
- Hover: border `--color-edge`, not on focus or disabled.
- Error with focus: `border-color: var(--color-err); box-shadow: var(--shadow-focus-field-error)`.
- Read-only: no Input change. Screens render `ReadonlyValue` (layer 2) instead of a read-only input.

### Radio [States]
- Unchecked: bg `--color-card`, border 1.5px solid `--color-line-dash`; hover border `--color-edge`.
- Checked: border 2px `--color-accent` on a `--color-card` bg, with a centred 8px `--color-accent` dot. Replace any filled-circle drawing.
- The whole label row is the hit area. Error is still UNDESIGNED.

### Select [States]
- Hover border `--color-edge`. This replaces the v2 `--color-line-dash` proposal if it was built.
- Error:
  - Border `--color-err`, no halo at rest.
  - Focus with error uses `--shadow-focus-field-error`.
  - Add `error: string | null`, rendered as 11.5 (`--type-small`) `--color-err` text under the control with a `--space-6` gap and linked by `aria-describedby`. Inside `Field`, Field renders the message instead.
- Disabled: `--opacity-disabled` on the wrapper (label and control), not on the select alone.

### Switch [States, Dark]
- Thumb: `--color-card` in both themes (dark #211F1C). Remove any always-light thumb.
- Off hover: track `--color-edge`.
- On hover: track `--color-accent-dark`.
- The whole label row is the hit area and toggles the switch.

### Textarea (field rule)
- Hover: border `--color-edge`.
- Error with focus: `--shadow-focus-field-error`.
- `mono` stays a proposal.

### VariableChip
No change.

## Lane 3: Breadcrumb, Divider, Drawer, Menu, Popover, Tabs, Tooltip

### Breadcrumb, Divider, Popover
No change.

### Drawer [Patterns]
- Default width 320 (`--size-inspector-width`) for every host. Remove any 380 wizard-preview width.
- Shadow `--shadow-popover` (dark value from the token).
- Closes on its ✕ and on Escape; focus returns to the opener.
- No scrim, and outside click does not dismiss (proposal kept; still UNDESIGNED).
- Non-modal: no focus trap.
- z `--z-drawer`, below the dialog scrim.

### Menu [States, Patterns, Dark]
- Keyboard focus: remove the inset focus ring on options. The active option uses the hover style (bg `--color-soft`) through `aria-activedescendant` or the Radix highlighted state.
- Add the following parts:
  - Section label row: `--type-overline`, `--tracking-overline`, `--color-mute`, padding `--space-8` `--space-8` `--space-4`.
  - Separator: 1px `--color-line`, full width, no margin.
  - Action row: leading icon 14 + label 12.5 (`--type-body-small`), gap `--space-8`.
  - Shortcut: trailing mono 11 `--color-ink-secondary`.
  - Disabled reason: trailing 11 `--color-mute` on a disabled item, which keeps its full-strength reason text inside the 45% row.
  - Danger item: label and icon `--color-err`, no tint.
  - Selected item in action menus: leading `check` 14. Listbox pickers keep the trailing check.
- `MenuItem` gains `shortcut: string | null` and `danger: boolean`.
- Width stays a prop (280 default; 220 filter picker, 180 row actions). The row-actions and account menus are compositions in Table and WorkspaceSwitcher, not Menu variants.
- Dark shadow: verify it comes from `--shadow-popover`.

### Tabs [States]
- Focus-visible: replace the inset ring with the outside `--shadow-focus-ring`, radius `--radius-4`, text `--color-ink`.
- Unselected hover: text `--color-ink`, and the 2px indicator previews in `--color-line-dash`.
- Disabled tab: global rule; text stays `--color-mute`.
- Add `count: number | null` per tab: render `Badge` tone neutral (11.5, padding 2 8) after a `--space-6` gap, and include the count in the accessible name.

### Tooltip [States]
- Add `arrow: boolean` (default true): an 8x8 square in `--color-tooltip-bg`, rotated 45 degrees, centred on the side facing the trigger, offset -4px. The Rail passes `false`; ChartTooltip never uses one.
- Timing: open delay 300ms becomes 400ms (`delayDuration`), hide 100ms after pointer leave, `sideOffset` 8, flip on collision. Put these in `Tooltip.constants.ts`.
- Add a multi-line form: max-width 240, `white-space: normal`, line-height `--leading-relaxed`. Single-line stays nowrap.
- Dark is confirmed (#ECE8E1 bubble, #1A1816 text, dark shadow). No change.

## Lane 4: Avatar, Badge, Banner, Callout, CountBadge, Meter, NodeTile, Progress, StatusDot, Stepper

### Avatar [States]
- Image: add `box-shadow: var(--shadow-swatch-inset)` over the cropped photo (`object-fit: cover`). While the image loads, or if it fails, show the initials on `--color-avatar-bg` in `--color-ink-secondary`.
- Add `status: StatusKind | null`: a 10px dot at bottom-right -1px, ring `0 0 0 2px var(--color-card)`, colour from the StatusDot kind map.
- Add `AvatarStack` (`avatars`, `max`):
  - sm 24 avatars overlapping by -6px, each with the 2px card ring.
  - Overflow chip: a 24 circle in `--color-soft` with text `--color-mute` 10/600 ("+2").

### Badge
- No code change. The dot keeps the dot tokens; the pages draw the text colour (OPEN, item 13).
- Add a story for the neutral count pill used in Tabs.

### Banner, CountBadge, NodeTile, Stepper
No change.

### Callout
- No change in code. The err default icon stays `esc` until item 18 is confirmed; if `alert` is accepted, change one constant.
- Add a story with a secondary sm "Retry" action (leading `refresh` 13).

### Meter [Patterns, Dark]
- Fill: `--color-accent` becomes `var(--chart-1)` (same value).
- Replace `tone: string | null` with `color: ChartColor`, default `chart-1`. `ChartColor` is the enum shared with Legend; put it in Meter's typedefs for now and move it to a shared chart typedefs file when Legend is built.

### Progress [States]
- Add `ProgressTone.Err` (fill `--color-err`, at the reached value).
- `value` becomes `number | null`. With `null` it renders indeterminate: a 35% wide segment that slides left to right over 1400ms, `linear`, infinite. It is static under `prefers-reduced-motion`. Drop `aria-valuenow` in this state.
- Add a caption slot below (`caption: ReactNode | null`, gap `--space-6`): either 11.5 `--color-mute` text ("64%") or a status Badge ("Indexed", "Failed").
- Success keeps the accent fill. Warn is still UNDESIGNED.

### StatusDot [States]
- Run kind: 8px `--color-accent` dot over a 14px halo (`inset: -3px`) in `--color-accent-glow`, pulsing over `--duration-pulse`. Static under reduced motion.
- `label` renders beside the dot: 12 (`--type-caption`) `--color-mute`, gap `--space-8`. When a label is present the dot is aria-hidden; otherwise it keeps `role="img"`.

## Lane 5: BulletList, Card, CodeBlock, ColorSwatch, DiffLine, DropZone, Heading, Metric, RowList, Skeleton, Tag, Text

### BulletList, Card, CodeBlock, DiffLine, Heading, Metric, RowList, Tag, Text
No change.

### ColorSwatch [States, Dark]
- Hover (unselected): replace the inset hairline with `0 0 0 2px var(--color-card), 0 0 0 4px var(--color-line-dash)`.
- Focus-visible (unselected): replace the hairline with `0 0 0 2px var(--color-card), 0 0 0 4px var(--color-accent)`, not layered on top of it.
- Focus on a selected swatch is still UNDESIGNED. Proposal: add `0 0 0 6px var(--color-card), 0 0 0 8px var(--color-accent)` outside the ink ring.
- Dark is confirmed. No change.

### DropZone [States]
- Hover: border colour `--color-edge` (stays dashed).
- Drag-over:
  - Border 1.5px solid `--color-accent`, bg `--color-accent-light`.
  - The title turns `--color-accent-dark` and is replaced by `dragTitle(count)` ("Drop to upload 3 files"), with no browse link.
  - Icon and hint stay `--color-mute`.
- Error: border colour `--color-err` (stays dashed). Add `error: string | null`; it replaces the hint with 12 `--color-err` text, while the title and link stay.
- "browse" link: always underlined, `text-underline-offset: 2px`, inherits 13/600, `--color-accent`; hover `--color-accent-dark`.
- New props: `dragTitle: (count: number) => string` and `error: string | null`.

### Skeleton [Patterns]
- Show only after a 300ms delay (`SKELETON_DELAY_MS`); render nothing before that.
- Line heights: add 7, 9, 10 and 14 to the existing 12 and 8. Each line takes `tone: 'strong' | 'soft'` (strong `--color-chip`, soft `--color-soft`).
- Add `SkeletonBox` (`width`, `height`, `tone`; radius `--radius-4`) for the 28 squares, 16 checkboxes, 70x18 badges and blocks.
- The page and table-row layouts are compositions in their consumers (Table, page containers), not Skeleton variants.
- Animation is still UNDESIGNED (proposal: opacity pulse at `--duration-pulse`, none under reduced motion).

## Not in this pass
Layer 2 and 3 components pick up their v3 changes when they are built from the updated specs. New components: AppShell (L2/4), Pagination (L2/2), SelectionBar (L2/1), FlowPort (L2/3), ChatSystemMessage, TypingIndicator and WidgetComposer (L3/5).
