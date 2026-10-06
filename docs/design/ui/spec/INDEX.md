# Design system component index (v3)

Source: DS-Foundations, DS-Actions, DS-Inputs, DS-Navigation, DS-Display, DS-Data, DS-Flow-Chat (revised pages plus the designer's written answers), and new in v3 DS-States, DS-Patterns and the DS-Dark-* twin of every page (read-only extraction). Tokens: [tokens.md](tokens.md) (light and dark values, focus, disabled, sizes, motion, z-index, breakpoints, chart palette). Specs: [components/](components/), 126 files, one per component. Changes an implementer must apply to the already-built layer 0 and layer 1 code: [DELTAS.md](DELTAS.md).

Status words used in every spec: **designed** (drawn on a page; v3 specs name the page, e.g. "drawn on DS-States"), **designer reply** (stated in writing, not drawn), **UNDESIGNED** (neither; a one-line proposal is given), **OPEN** (two drawn sources disagree; the spec states the proposal it uses until confirmed), **decided** (an UNDESIGNED or OPEN point settled by the product owner; section 7 lists what was decided). Props blocks show required fields and enums for clarity; implementation keeps the repo convention (optional props with defaults) and `null`, never `undefined`, for absent data. Strings (labels, aria-labels) arrive as props; features own the i18n keys.

## 1. What changed in v3

Three extraction passes, then this reconciliation:
- **DS-States** (and DS-Dark-States) draws hover, active, focus, loading, error and disabled for 36 components. Most v2 hover and loading proposals are replaced. The main rules are: rows and ghost controls hover to `--color-soft`; fields and dashed affordances hover to a `--color-edge` border; pressed uses the hover colour, except secondary and AddTile, which use `--color-chip`; loading is a 13px spinner before a kept label; Menu keyboard focus uses the hover style with no ring; Tabs focus moves to the outside ring; Tooltip gets an arrow and a 400ms delay; Checkbox and Radio get a 1.5px border; the Switch thumb is `--color-card` in both themes; the StatusDot run pulse is 1.2s. AvatarStack, the IconButton xs 22 size and the SelectButton label-inside variant are added inside existing specs.
- **DS-Patterns** (and DS-Dark-Patterns) draws Toast, the responsive layout, table patterns (sorting, selection, row menu, expansion, pagination, loading, empty, error), filter picker and Clear all, the chart palette, the series legend, two-series line hover, canvas interactions (ports, edge drawing, marquee, palette drag), chat extras and the ThemeToggle. It adds seven specs: AppShell, Pagination, SelectionBar, FlowPort, ChatSystemMessage, TypingIndicator and WidgetComposer.
- **DS-Dark-*** for the seven v2 pages: each is a 1:1 token remap of its light page, and no token value changed. Three spec-level corrections: the WidgetPreview panel shadow is `--shadow-popover`; the RunRow and RunNode glyphs use `--color-on-dark`; the chart bar radius is 4.
- **Reconciliation:** BarChart opacity is now 1 at rest and .82 for the other bars while one is hovered (it was .82 at rest). Legend, LineChart and ChartTooltip now use the drawn series palette instead of the "not drawn" notes from the dark pass. ThemeToggle uses the drawn group, which replaces the "proposal stays" note from the dark pass. The chart tooltip uses the `--z-popover` layer. The FilterChip picker moves to FilterBar so layer 1 stays lane-pure. Menu presets are compositions owned by Table and WorkspaceSwitcher. Textarea follows the field hover rule. `--duration-pulse` is promoted to a token. The `--color-edge` and `--color-line-dash` uses are widened. The wizard preview drawer is 320, and only the docked preview keeps `--size-wizard-side-width` 380 (OPEN against about 360).

## 1a. What changed in v2

Designer answers applied everywhere: all 18 hue steps and every colour token have dark values; teal is the only accent; tooltip inverts to a light bubble in dark; theme is Light, Dark or System (account menu and Settings > Profile); two focus rules (fields: 1px accent border plus 3px halo; everything else: outside ring with 2px gap, inset on list and table rows) and selection (2px border plus 4px halo) is not focus; one disabled rule (normal colours at 45%, no hover or focus, `not-allowed`); small controls are 28 everywhere; dialogs 560 / 640 / 720 / 920 and auth cards 400 / 460; indicators are 2px; avatar tint is `--color-accent-light`; status dots are brighter than text on purpose; standalone links underline on hover only, links in sentences always; applied FilterChip has two targets; minimum width 1024, compact layout below 1280; 61 icons with `data-icon` names.

Consolidation pass (this index): every spec was checked against tokens.md names and values. Fixed: bare `--shadow-focus` became `--shadow-focus-field`; `--leading-snug` and `--leading-loose` became `--leading-relaxed` (1.45); `--tracking-caps` became `--tracking-overline`; nonexistent `--size-header-height` and `--layout-form-width` references removed; RunNode uses `--color-ok-line` and `--color-ok-on-dark`; component size tokens (switch, checkbox, dot, bar, step circle, status bar, wizard, menu, rail item, row-sm) were given names in tokens.md; no spec cites `--size-control-compact`, the 440 or 600 dialog widths, #D4E6E4, the old .5 and .55 disabled opacity or the old icon names, except in "was" notes.

Conflicts between page markup and written designer rules, resolved in favour of the written rule (listed in section 7 for confirmation): Badge dot uses the brighter dot token, DropZone "browse" is underlined, Topbar pill dot is the dot token, SegmentedControl is 28 (page draws about 31 and 25).

Merged duplicates (extra file removed, content folded into the survivor):
| survivor | absorbed |
|---|---|
| Input | TextField (Foundations dark sample) |
| Badge | StatusPill (Navigation, Data) |
| Tag | NodeChip (Flow-Chat) |
| Callout | NodeCallout (Flow-Chat) |
| NodeTile | TypeTile (Display), the inline "IconTile" of Data and Navigation |
| OptionCard | SourceTile (Navigation) |
| DropZone | Dropzone (Navigation) |
| Tabs, Breadcrumb, Stepper, Tooltip, Avatar, IconButton, SegmentedControl | the `alt-DS-Navigation/` copies |
| Switch | Toggle (page name) |
| VariableChip, ReadonlyValue, SearchInput | `var_token`, `readonly`, `search` (page names) |

Split back out in v2: **Meter** (was folded into Progress; the Data and Display pages now draw it; `bar_x` is only a helper returning a bar's x position, not a chart). New in v2: **ThemeToggle**, **Drawer**, **NarrowScreenNotice**, **Toast**, **LinkedItem** (was wrongly aliased to LinkCard: a dashed row link, not a vertical card), **Meter**.

Kept separate on purpose but cross-referenced: Banner (edge-to-edge strip) vs Callout (inline block) vs Toast (floating); ChartTooltip vs Tooltip (custom anchor, same tokens); AttentionCard (composes Notice rows) vs Notice; DisplayTitle vs Heading; ListItem (also the SecondaryNav row) vs NavItem; Meter (measurement) vs Progress (task progress); Drawer (compact-width host) vs Panel (docked content).

Reading the specs: scope tags in section 2 say whether a component is generic or domain-bound; the build can include or exclude the domain-bound set (section 4).

## 2. Component inventory

Columns: **layer / lane** refer to sections 3 and 4 (L0 is the single-owner foundation). **Radix** is the primitive from the installed `radix-ui` package, wrapped inside `shared/ui` only. **Exists today** is judged against `apps/web/src/shared/ui`: all 99 generic components exist; the 27 domain-bound ones do not yet. **Scope**: *generic* is reusable anywhere; *generic, product-flavoured* has generic props but product vocabulary (kept in the default build); **DOMAIN: flow / chat / runs** is bound to the flow builder, the chat or widget, or conversation, run and trace views (optional, section 4).

| component | category | layer / lane | depends on | Radix primitive | exists today / what changes | scope |
|---|---|---|---|---|---|---|
| [AddTile](components/AddTile.md) | Actions | L1 / 1 | Icon | - | yes | generic |
| [AppShell](components/AppShell.md) | Layout | L2 / 4 | Drawer, NarrowScreenNotice (nav, topbar and panes are slots) | - | yes | generic |
| [AttentionCard](components/AttentionCard.md) | Display | L2 / 5 | Card, Notice | - | yes | generic, product-flavoured |
| [AuthFrame](components/AuthFrame.md) | Layout | L2 / 4 | Card, Input, Button, SegmentedControl | - | yes | generic |
| [Avatar](components/Avatar.md) | Display | L1 / 4 | StatusDot (status, v3) | Avatar (optional, image) | yes | generic |
| [Badge](components/Badge.md) | Display | L1 / 4 | - | - | yes | generic |
| [Banner](components/Banner.md) | Display | L1 / 4 | Icon | - | yes | generic |
| [BarChart](components/BarChart.md) | Data | L3 / 2 | ChartTooltip, Legend | - (chart library, ADR needed) | yes | generic |
| [Breadcrumb](components/Breadcrumb.md) | Navigation | L1 / 3 | - | - | yes | generic |
| [BulletList](components/BulletList.md) | Display | L1 / 5 | - | - | yes | generic |
| [Button](components/Button.md) | Actions | L1 / 1 | Icon | - | yes; add xs 22 text ghost and lg 40 (sm stays 28), outlined danger, global 0.45 disabled, loading and active (drawn, v3), `--shadow-focus-ring` | generic |
| [Callout](components/Callout.md) | Display | L1 / 4 | Icon | - | yes | generic |
| [Card](components/Card.md) | Display | L1 / 5 | - | - | yes; add tone default/panel/sunken, pad 12/14/16, `selected` (2px accent border + 4px halo), zero-padding, `as` | generic |
| [CardHeader](components/CardHeader.md) | Display | L2 / 4 | Card, Heading, Button | - | yes | generic |
| [ChartCard](components/ChartCard.md) | Data | L3 / 2 | Card, Badge, Legend (legend slot, v3) | - | yes | generic |
| [ChartTooltip](components/ChartTooltip.md) | Data | L3 / 2 | - | - (Tooltip tokens; custom anchor) | yes | generic |
| [ChatBubble](components/ChatBubble.md) | Chat | L3 / 5 | Icon (typing and system states moved to TypingIndicator, ChatSystemMessage) | - | no | **DOMAIN: chat** |
| [ChatDivider](components/ChatDivider.md) | Chat | L3 / 5 | Icon | - | no | **DOMAIN: chat** |
| [ChatStatus](components/ChatStatus.md) | Chat | L3 / 5 | Icon | - | no | **DOMAIN: chat** |
| [ChatSystemMessage](components/ChatSystemMessage.md) | Chat | L3 / 5 | Icon | - | no; new (v3) | **DOMAIN: chat** |
| [Checkbox](components/Checkbox.md) | Inputs | L1 / 2 | Icon | Checkbox | yes | generic |
| [CodeBlock](components/CodeBlock.md) | Display | L1 / 5 | - | - | yes | generic |
| [CodeEditor](components/CodeEditor.md) | Display | L2 / 5 | CodeBlock | - (editor library, ADR needed) | yes | generic |
| [ColorSwatch](components/ColorSwatch.md) | Actions | L1 / 5 | - | RadioGroup (optional) | yes | generic |
| [CompactNode](components/CompactNode.md) | Flow | L3 / 3 | NodeTile | - | no | **DOMAIN: flow** |
| [Composer](components/Composer.md) | Inputs | L2 / 2 | Input, IconButton, TextLink | - | no | **DOMAIN: chat** |
| [ConversationRow](components/ConversationRow.md) | Data | L3 / 1 | Avatar, Badge | - | no | **DOMAIN: runs** |
| [CountBadge](components/CountBadge.md) | Display | L1 / 4 | - | - | yes | generic |
| [Dialog](components/Dialog.md) | Overlay | L1 / 1 | Button, IconButton, Callout (error, v3) | Dialog | yes; panel bg, divided header/body/footer, icon close, left footer slot, widths 560/640/720/920, dark border, new z scale; v3: busy, error, destructive | generic |
| [DiffLine](components/DiffLine.md) | Display | L1 / 5 | - | - | yes | generic |
| [DisplayTitle](components/DisplayTitle.md) | Layout | L2 / 3 | Heading, Text | - | yes | generic |
| [Divider](components/Divider.md) | Layout | L1 / 3 | - | Separator | yes | generic |
| [Drawer](components/Drawer.md) | Overlay | L1 / 3 | - | - | yes | generic |
| [DropZone](components/DropZone.md) | Inputs | L1 / 5 | Icon | - | yes | generic |
| [EdgeLabel](components/EdgeLabel.md) | Flow | L3 / 3 | - | - | no | **DOMAIN: flow** |
| [EmptyState](components/EmptyState.md) | Display | L2 / 5 | NodeTile, Heading, Button | - | yes | generic |
| [Field](components/Field.md) | Inputs | L1 / 2 | - | Label (optional) | yes; label becomes 12px mute caption, hint/error 11.5px, gap `--space-5`, error halo | generic |
| [FileRow](components/FileRow.md) | Display | L2 / 4 | Badge, IconButton, Icon | - | yes | generic, product-flavoured |
| [FilterBar](components/FilterBar.md) | Data | L3 / 2 | SearchInput, FilterChip, Popover, Checkbox, SegmentedControl, Button (FilterPicker lives here) | Popover | yes | generic |
| [FilterChip](components/FilterChip.md) | Actions | L1 / 2 | Icon | - | yes | generic |
| [FlowCanvas](components/FlowCanvas.md) | Flow | L3 / 3 | ZoomControl, FlowEdge, EdgeLabel, FlowPort, SelectionBar, Menu, Toast | - (React Flow or custom, ADR needed) | no | **DOMAIN: flow** |
| [FlowEdge](components/FlowEdge.md) | Flow | L3 / 3 | IconButton | - | no | **DOMAIN: flow** |
| [FlowNode](components/FlowNode.md) | Flow | L3 / 4 | NodeHeader, NodeOutput, Tag, Callout, FlowPort | - | no | **DOMAIN: flow** |
| [FlowPort](components/FlowPort.md) | Flow | L2 / 3 | - | - | no; new (v3) | **DOMAIN: flow** |
| [Heading](components/Heading.md) | Typography | L1 / 5 | - | - | yes | generic |
| [Icon](components/Icon.md) | Foundations | L0 / - | - | - | yes | generic |
| [IconButton](components/IconButton.md) | Actions | L1 / 1 | Icon | - | yes | generic |
| [IconRow](components/IconRow.md) | Display | L2 / 5 | NodeTile | - | yes | generic |
| [Identity](components/Identity.md) | Display | L2 / 5 | Avatar, NodeTile | - | yes | generic |
| [Input](components/Input.md) | Inputs | L1 / 2 | - | - | yes; add size md/lg, mono, 1px accent border + 3px halo (`--shadow-focus-field`), fixed height, 0.45 disabled, hover `--color-edge` (v3) | generic |
| [Inspector](components/Inspector.md) | Layout | L2 / 4 | Panel, IconButton, Switch, VariableChip, NodeTile, Drawer | - | yes | generic |
| [KeyValue](components/KeyValue.md) | Display | L2 / 3 | SourceBadges, Badge | - | yes | generic |
| [Legend](components/Legend.md) | Display | L2 / 3 | StatusDot | - | yes | generic |
| [LineChart](components/LineChart.md) | Data | L3 / 2 | ChartTooltip, Legend | - (chart library, ADR needed) | yes | generic |
| [LinkCard](components/LinkCard.md) | Display | L2 / 5 | NodeTile, TextLink, Icon | - | yes | generic |
| [LinkedItem](components/LinkedItem.md) | Data | L2 / 5 | NodeTile, Icon | - | no | **DOMAIN: runs** |
| [ListGroup](components/ListGroup.md) | Data | L3 / 5 | IconButton | - | yes | generic |
| [ListHead](components/ListHead.md) | Data | L3 / 1 | Icon | - (sort menu: DropdownMenu) | yes | generic |
| [ListItem](components/ListItem.md) | Navigation | L2 / 1 | NodeTile, StatusDot | - | yes | generic |
| [Menu](components/Menu.md) | Overlay | L1 / 3 | Icon | DropdownMenu (action menus), Popover (listbox surface) | yes | generic |
| [Meter](components/Meter.md) | Display | L1 / 4 | - | - (role="meter") | yes | generic |
| [Metric](components/Metric.md) | Display | L1 / 5 | - | - | yes | generic |
| [NarrowScreenNotice](components/NarrowScreenNotice.md) | Layout | L2 / 4 | Icon | - | yes | generic |
| [NavItem](components/NavItem.md) | Navigation | L2 / 1 | Icon, CountBadge, Tooltip | - | yes | generic |
| [NavSectionLabel](components/NavSectionLabel.md) | Navigation | L2 / 1 | IconButton | - | yes | generic |
| [NodeHeader](components/NodeHeader.md) | Flow | L3 / 4 | NodeTile | - | no | **DOMAIN: flow** |
| [NodeOutput](components/NodeOutput.md) | Flow | L3 / 4 | - | - | no | **DOMAIN: flow** |
| [NodeTile](components/NodeTile.md) | Display | L1 / 4 | Icon | - | yes | generic |
| [Notice](components/Notice.md) | Display | L2 / 5 | Card, NodeTile, Button | - | yes | generic |
| [OptionCard](components/OptionCard.md) | Inputs | L2 / 2 | NodeTile, Checkbox, Radio, Card | RadioGroup, Checkbox | yes | generic |
| [PageHeader](components/PageHeader.md) | Layout | L2 / 3 | Breadcrumb, Tabs, Heading | - | yes | generic |
| [Pagination](components/Pagination.md) | Data | L2 / 2 | Select, IconButton | - | yes | generic |
| [PaletteItem](components/PaletteItem.md) | Data | L3 / 2 | NodeTile | - | no | **DOMAIN: flow** |
| [PaneBar](components/PaneBar.md) | Layout | L2 / 3 | - | - | yes | generic |
| [PaneHeader](components/PaneHeader.md) | Layout | L2 / 3 | Avatar, Button | - | yes | generic |
| [Panel](components/Panel.md) | Layout | L2 / 4 | Heading | - | yes | generic |
| [Popover](components/Popover.md) | Overlay | L1 / 3 | - | Popover | yes | generic |
| [Progress](components/Progress.md) | Display | L1 / 4 | Badge (caption, v3) | Progress (optional) | yes | generic |
| [PromptEditor](components/PromptEditor.md) | Inputs | L2 / 2 | VariableChip, Menu, Popover, Textarea | Popover (+ editor library, ADR needed) | yes | generic, product-flavoured |
| [QuickReplies](components/QuickReplies.md) | Chat | L3 / 5 | - | ToggleGroup (optional) | no | **DOMAIN: chat** |
| [Radio](components/Radio.md) | Inputs | L1 / 2 | - | RadioGroup | yes | generic |
| [Rail](components/Rail.md) | Navigation | L2 / 1 | NavItem, Divider, Tooltip (arrow off) | - | yes | generic |
| [ReadonlyValue](components/ReadonlyValue.md) | Inputs | L2 / 2 | VariableChip | - | yes | generic, product-flavoured |
| [ResultCard](components/ResultCard.md) | Display | L2 / 5 | Badge, Card | - | yes | generic, product-flavoured |
| [RowList](components/RowList.md) | Display | L1 / 5 | - | - | yes | generic |
| [RunNode](components/RunNode.md) | Flow | L3 / 3 | NodeTile, Icon | - | no | **DOMAIN: flow** |
| [RunRow](components/RunRow.md) | Data | L3 / 5 | StatusDot, NodeTile, Badge | - | no | **DOMAIN: runs** |
| [SearchInput](components/SearchInput.md) | Inputs | L2 / 2 | Input, Icon, IconButton | - | yes | generic |
| [SecondaryNav](components/SecondaryNav.md) | Navigation | L2 / 1 | NavSectionLabel, ListItem, IconButton | - | yes | generic |
| [SegmentedControl](components/SegmentedControl.md) | Actions | L1 / 1 | - | ToggleGroup | yes | generic |
| [Select](components/Select.md) | Inputs | L1 / 2 | - | - (native) | yes | generic |
| [SelectButton](components/SelectButton.md) | Inputs | L2 / 2 | Icon, NodeTile, Menu, Popover | Popover | yes | generic |
| [SelectionBar](components/SelectionBar.md) | Data | L2 / 1 | Button, IconButton | - | yes | generic |
| [Sidebar](components/Sidebar.md) | Navigation | L2 / 1 | WorkspaceSwitcher, NavItem, NavSectionLabel, IconButton, Avatar, SegmentedControl | - | yes | generic |
| [Skeleton](components/Skeleton.md) | Display | L1 / 5 | - | - | yes | generic |
| [SourceBadges](components/SourceBadges.md) | Display | L2 / 3 | Badge | - | yes | generic, product-flavoured |
| [Stat](components/Stat.md) | Display | L2 / 5 | Card | - | yes | generic |
| [StatusBar](components/StatusBar.md) | Layout | L2 / 3 | StatusDot, Button | - | yes | generic |
| [StatusDot](components/StatusDot.md) | Display | L1 / 4 | - | - | yes | generic |
| [Stepper](components/Stepper.md) | Navigation | L1 / 4 | Icon | - | yes | generic |
| [SubnavItem](components/SubnavItem.md) | Data | L3 / 1 | - | - | yes | generic |
| [Switch](components/Switch.md) | Inputs | L1 / 2 | - | Switch | yes | generic |
| [Table](components/Table.md) | Data | L3 / 1 | TableCell, TableCellLead, Card, Checkbox, Badge, IconButton, Menu, Skeleton, EmptyState, Callout, SelectionBar, Pagination | - (row menu: DropdownMenu) | yes | generic |
| [TableCell](components/TableCell.md) | Data | L3 / 1 | - | - | yes | generic |
| [TableCellLead](components/TableCellLead.md) | Data | L3 / 1 | Avatar, NodeTile | - | yes | generic |
| [Tabs](components/Tabs.md) | Navigation | L1 / 3 | Badge (count, v3) | Tabs | yes | generic |
| [Tag](components/Tag.md) | Display | L1 / 5 | - | - | yes | generic |
| [Text](components/Text.md) | Typography | L1 / 5 | - | - | yes | generic |
| [TextLink](components/TextLink.md) | Actions | L1 / 1 | - | - | yes (as `Link`); add tone err, `--type-caption-strong`, hover-only underline when standalone, `inline` always underlined | generic |
| [Textarea](components/Textarea.md) | Inputs | L1 / 2 | - | - | yes | generic |
| [ThemeToggle](components/ThemeToggle.md) | Foundations | L0 / - | Icon, Tooltip (menu variant, v3) | ToggleGroup | built in L0 as a radiogroup; v3 redraws it as the SegmentedControl-look group (menu and settings variants) | generic |
| [TimelineWaterfall](components/TimelineWaterfall.md) | Data | L3 / 4 | Tooltip, Legend | - | no | **DOMAIN: runs** |
| [Toast](components/Toast.md) | Overlay | L1 / 1 | Icon, IconButton | Toast | yes; restyle to the drawn surface (v3: DS-Patterns), bottom-left viewport, 4s / 8s / sticky timing, max 3 | generic |
| [Tooltip](components/Tooltip.md) | Overlay | L1 / 3 | - | Tooltip | yes | generic |
| [Topbar](components/Topbar.md) | Layout | L2 / 3 | Breadcrumb, Badge, Button | - | yes | generic |
| [TraceRow](components/TraceRow.md) | Data | L3 / 4 | NodeTile | - (tree role) | no | **DOMAIN: runs** |
| [TreeFolder](components/TreeFolder.md) | Data | L3 / 1 | Icon, SubnavItem | Collapsible | yes | generic |
| [TriggerNode](components/TriggerNode.md) | Flow | L3 / 3 | Icon, FlowPort | - | no | **DOMAIN: flow** |
| [TypingIndicator](components/TypingIndicator.md) | Chat | L3 / 5 | - | - | no; new (v3) | **DOMAIN: chat** |
| [VariableChip](components/VariableChip.md) | Inputs | L1 / 2 | - | - | yes | generic, product-flavoured |
| [WidgetComposer](components/WidgetComposer.md) | Chat | L3 / 5 | IconButton | - | no; new (v3), post-MVP vision | **DOMAIN: chat** |
| [WidgetLauncher](components/WidgetLauncher.md) | Chat | L3 / 5 | Icon | - | no | **DOMAIN: chat** |
| [WidgetPreview](components/WidgetPreview.md) | Chat | L3 / 5 | ChatBubble, Avatar, WidgetComposer, TypingIndicator | - | no | **DOMAIN: chat** |
| [WizardFrame](components/WizardFrame.md) | Layout | L2 / 4 | Stepper, Panel, Button, Drawer | - | yes | generic |
| [WorkspaceSwitcher](components/WorkspaceSwitcher.md) | Navigation | L2 / 1 | Menu, Popover, Avatar, Icon, ThemeToggle | Popover | yes | generic, product-flavoured |
| [ZoomControl](components/ZoomControl.md) | Flow | L3 / 3 | IconButton | Toolbar | no | **DOMAIN: flow** |

Existing `shared/ui` pieces without a design page: **PasswordInput** (keep; builds on Input and a ghost IconButton once they exist; the 61-icon set has no eye icon, see section 7) and the repo `Toast` (covered by the new Toast spec).

## 3. Build order (dependency layers)

Barrier rule: every lane finishes a layer before the next layer starts. Within a layer, a component may depend only on components in its own lane; dependencies on earlier layers are free. The inventory was checked against this rule by script. The v3 inventory has three exceptions, all caused by v3 changes to components that are already built (layer 1 delta pass below): Dialog (L1/1) uses Callout (L1/4), Tabs (L1/3) uses Badge (L1/4), and ThemeToggle (L0) uses Tooltip (L1/3).

### Layer 0: tokens, theme store and toggle, Icon (single owner, before any lane)
1. Rewrite `apps/web/src/shared/styles/tokens.css` from tokens.md: light values in `:root`, dark overrides under `:root[data-theme="dark"]`, and `color-scheme` per theme. Include every colour, shadow (per theme), scrim, hue, type, tracking, leading, size, motion, z-index and breakpoint token. `--shadow-focus` becomes `--shadow-focus-field` (3px halo). Add `--shadow-focus-ring`, `--shadow-focus-ring-inset`, `--shadow-selected`, `--opacity-disabled: .45`, and in v3 `--duration-pulse` and the `--chart-*` aliases. No blue or violet accent.
2. Theme store in `shared` (storage layer): `light | dark | system`, persisted on the user. The server field is a backend contract outside this scope; until it exists, use localStorage with the same shape. Add a pre-paint script that sets `data-theme`, and a `matchMedia` listener for System.
3. **ThemeToggle**: drawn in v3 on DS-Patterns as a SegmentedControl-look group with `aria-pressed` buttons, in two variants: `menu` (icons only, each with a Tooltip) and `settings` (text). It does not import SegmentedControl. Its v3 rebuild needs Tooltip, so it lands in the delta pass after lane 3's Tooltip change.
4. **Icon**: 61 icons from the DS-Foundations SVGs (16px grid, 1.5 stroke, round caps, `currentColor`), an `IconName` enum and lookup by `data-icon` name. v3 states and patterns use only icons already in the set (spinner, minus, refresh, filter, hand, copy, upload, sort, arrow-up, arrow-down).
5. Verify the fonts (Onest and JetBrains Mono; the repo uses variable fonts), the media queries (`(min-width: 1440px)`, `(max-width: 1279px)`, `(max-width: 1023px)`), and that no existing component hard-codes a colour that now has a dark value.
Exit: `pnpm lint`, `typecheck`, `format:check`, `depcruise`, `check:comments` and `test` are green, and existing screens render unchanged in light.

### Layer 1: primitives (45 components)
Leaf components that need only tokens and Icon. Cross-lane dependencies are forbidden here. Dialog and Toast sit in lane 1 with Button and IconButton. Callout and Card take actions and headers as injected children. Stepper sits in lane 4 with the frames that use it.
Exit per component: spec implemented, `.module.scss` using tokens only, light and dark verified in Storybook, disabled and focus follow the global rules, test file, story, exported through the folder `index.ts`.

### Layer 1 delta pass (v3; before layer 2)
Layers 0 and 1 are built. The v3 changes to them are listed component by component in [DELTAS.md](DELTAS.md) and grouped by lane, with the same five owners. Each change lands as its own small pull request, with a test that fails without it. Cross-lane imports are allowed in this pass only to an existing export whose API this pass does not change: Dialog may import Callout, and Tabs may import Badge. ThemeToggle (layer 0 owner) imports Tooltip after lane 3 merges Tooltip's `arrow` and delay change. Rough effort: L0 3, lane 1 9, lane 2 8, lane 3 6, lane 4 5, lane 5 4.

### Layer 2: composites (43 components)
Compositions of layer 1 components:
- navigation shell: Sidebar, Rail, SecondaryNav and parts
- page structure: AppShell, PageHeader, Topbar, Panel, Inspector, WizardFrame, AuthFrame, NarrowScreenNotice
- input composites: SearchInput, SelectButton, Composer, PromptEditor, OptionCard, Pagination
- display composites: Notice, EmptyState, KeyValue, Legend
- table and canvas helpers: SelectionBar, FlowPort

### Layer 3: data, charts, flow and chat (36 components)
Table family and lists, charts and filters, traces and the waterfall, flow canvas and nodes, chat bubbles, system messages, typing indicator and the widget preview. Three library choices (flow canvas, charts, editors) should be settled in ADRs before layer 3 starts.

Membership by layer and lane (domain-bound components in bold with their area in brackets):

**Layer 0** (single owner): tokens.css, theme store, ThemeToggle, Icon

**Layer 1**
- lane 1: AddTile, Button, Dialog, IconButton, SegmentedControl, TextLink, Toast
- lane 2: Checkbox, Field, FilterChip, Input, Radio, Select, Switch, Textarea, VariableChip
- lane 3: Breadcrumb, Divider, Drawer, Menu, Popover, Tabs, Tooltip
- lane 4: Avatar, Badge, Banner, Callout, CountBadge, Meter, NodeTile, Progress, StatusDot, Stepper
- lane 5: BulletList, Card, CodeBlock, ColorSwatch, DiffLine, DropZone, Heading, Metric, RowList, Skeleton, Tag, Text

**Layer 2**
- lane 1: ListItem, NavItem, NavSectionLabel, Rail, SecondaryNav, SelectionBar, Sidebar, WorkspaceSwitcher
- lane 2: **Composer** [chat], OptionCard, Pagination, PromptEditor, ReadonlyValue, SearchInput, SelectButton
- lane 3: DisplayTitle, **FlowPort** [flow], KeyValue, Legend, PageHeader, PaneBar, PaneHeader, SourceBadges, StatusBar, Topbar
- lane 4: AppShell, AuthFrame, CardHeader, FileRow, Inspector, NarrowScreenNotice, Panel, WizardFrame
- lane 5: AttentionCard, CodeEditor, EmptyState, IconRow, Identity, LinkCard, **LinkedItem** [runs], Notice, ResultCard, Stat

**Layer 3**
- lane 1: **ConversationRow** [runs], ListHead, SubnavItem, Table, TableCell, TableCellLead, TreeFolder
- lane 2: BarChart, ChartCard, ChartTooltip, FilterBar (with FilterPicker), LineChart, **PaletteItem** [flow]
- lane 3: **CompactNode** [flow], **EdgeLabel** [flow], **FlowCanvas** [flow], **FlowEdge** [flow], **RunNode** [flow], **TriggerNode** [flow], **ZoomControl** [flow]
- lane 4: **FlowNode** [flow], **NodeHeader** [flow], **NodeOutput** [flow], **TimelineWaterfall** [runs], **TraceRow** [runs]
- lane 5: **ChatBubble** [chat], **ChatDivider** [chat], **ChatStatus** [chat], **ChatSystemMessage** [chat], ListGroup, **QuickReplies** [chat], **RunRow** [runs], **TypingIndicator** [chat], **WidgetComposer** [chat], **WidgetLauncher** [chat], **WidgetPreview** [chat]

## 4. Five build lanes

Effort units are rough: 1 trivial, 2 small, 3 medium, 4 to 5 large. With domain-bound components included, every lane has work in every layer, so no lane idles at a barrier. A lane depends only on earlier layers or on itself. New v3 components are AppShell 3, Pagination 2, SelectionBar 2, FlowPort 1, ChatSystemMessage 1, TypingIndicator 1 and WidgetComposer 2.

### Lane 1: actions, dialogs and toasts, shell navigation (effort 55; 52 without domain-bound)
- Layer 1 (effort 18): AddTile, Button, Dialog, IconButton, SegmentedControl, TextLink, Toast
- Layer 2 (effort 21): ListItem, NavItem, NavSectionLabel, Rail, SecondaryNav, SelectionBar, Sidebar, WorkspaceSwitcher
- Layer 3 (effort 16): **ConversationRow** [runs], ListHead, SubnavItem, Table, TableCell, TableCellLead, TreeFolder

### Lane 2: inputs, filters and charts (effort 56; 51 without domain-bound)
- Layer 1 (effort 19): Checkbox, Field, FilterChip, Input, Radio, Select, Switch, Textarea, VariableChip
- Layer 2 (effort 20): **Composer** [chat], OptionCard, Pagination, PromptEditor, ReadonlyValue, SearchInput, SelectButton
- Layer 3 (effort 17): BarChart, ChartCard, ChartTooltip, FilterBar (with FilterPicker), LineChart, **PaletteItem** [flow]

### Lane 3: overlays, page structure, flow canvas (effort 57; 38 without domain-bound)
- Layer 1 (effort 19): Breadcrumb, Divider, Drawer, Menu, Popover, Tabs, Tooltip
- Layer 2 (effort 20): DisplayTitle, **FlowPort** [flow], KeyValue, Legend, PageHeader, PaneBar, PaneHeader, SourceBadges, StatusBar, Topbar
- Layer 3 (effort 18): **CompactNode** [flow], **EdgeLabel** [flow], **FlowCanvas** [flow], **FlowEdge** [flow], **RunNode** [flow], **TriggerNode** [flow], **ZoomControl** [flow]

### Lane 4: display atoms, steppers and frames, flow nodes and traces (effort 55; 40 without domain-bound)
- Layer 1 (effort 21): Avatar, Badge, Banner, Callout, CountBadge, Meter, NodeTile, Progress, StatusDot, Stepper
- Layer 2 (effort 19): AppShell, AuthFrame, CardHeader, FileRow, Inspector, NarrowScreenNotice, Panel, WizardFrame
- Layer 3 (effort 15): **FlowNode** [flow], **NodeHeader** [flow], **NodeOutput** [flow], **TimelineWaterfall** [runs], **TraceRow** [runs]

### Lane 5: display content, chat and runs (effort 58; 41 without domain-bound)
- Layer 1 (effort 20): BulletList, Card, CodeBlock, ColorSwatch, DiffLine, DropZone, Heading, Metric, RowList, Skeleton, Tag, Text
- Layer 2 (effort 20): AttentionCard, CodeEditor, EmptyState, IconRow, Identity, LinkCard, **LinkedItem** [runs], Notice, ResultCard, Stat
- Layer 3 (effort 18): **ChatBubble** [chat], **ChatDivider** [chat], **ChatStatus** [chat], **ChatSystemMessage** [chat], ListGroup, **QuickReplies** [chat], **RunRow** [runs], **TypingIndicator** [chat], **WidgetComposer** [chat], **WidgetLauncher** [chat], **WidgetPreview** [chat]

Layer 0 is a separate single-owner task (effort 7), done before any lane starts. Lane totals: 55, 56, 57, 55, 58, a maximum spread of 3 (5% of the mean). Without domain-bound components: 52, 51, 38, 40, 41.

Lane rules (apply to every lane):
- Write only into `apps/web/src/shared/ui/<Name>/` (folder, `index.ts`, `<Name>.tsx`, `.module.scss`, `.typedefs.ts`, `.constants.ts`, `.helpers.ts`, `.test.tsx`, `.stories.tsx`). No comments in code, no `any`, no default exports, no raw colours or pixel values in scss outside the token file, and Radix only here. AppShell's `useBreakpoint` hook goes in `shared` (logic), beside the theme store.
- Disabled, focus, hover and selection use the global rules in tokens.md (v3 adds the drawn hover and pressed rules); no component invents its own.
- Do not edit `tokens.css` or the theme store from a lane. A missing token goes back to layer 0 as a request.
- Existing components (Button, Card, Dialog, Field, Input, Link, Toast) keep their current exports and defaults. Visual changes are in section 6 and DELTAS.md. Land them as separate small pull requests.
- Components marked **DOMAIN** may be skipped (section 5); nothing generic depends on them.

## 5. Domain-bound components (include or exclude)

These components know about the flow builder, the chat or widget, or conversation, run and trace views. Their props stay domain-free (kinds are enums and text is passed in), but their names, anatomy and usage are product-specific. The build can include or exclude each group. Nothing outside a group depends on it, apart from links inside the group such as FlowCanvas to ZoomControl or FlowPort, and WidgetPreview to ChatBubble or WidgetComposer. This was verified on the dependency column.

| group | components | layer / lane | effort | what it needs that is still open |
|---|---|---|---|---|
| **Flow canvas and nodes** [flow] | CompactNode, EdgeLabel, FlowCanvas, FlowEdge, FlowNode, FlowPort, NodeHeader, NodeOutput, PaletteItem, RunNode, TriggerNode, ZoomControl | L2/3, L3/2, L3/3, L3/4 | 29 | canvas library ADR (the design questions are decided, section 7 item 6) |
| **Chat and widget** [chat] | ChatBubble, ChatDivider, ChatStatus, ChatSystemMessage, Composer, QuickReplies, TypingIndicator, WidgetComposer, WidgetLauncher, WidgetPreview | L2/2, L3/5 | 17 | launcher hover, live widget loading, error and offline (no proposal yet); WidgetComposer is post-MVP |
| **Conversation, run and trace rows, waterfall** [runs] | ConversationRow, LinkedItem, RunRow, TimelineWaterfall, TraceRow | L2/5, L3/1, L3/4, L3/5 | 13 | data from the Inbox and Traces features |

Total domain-bound effort: 59 of 281 lane units (27 of 126 components). Excluding them empties layer 3 for lanes 3 and 4 and leaves lane 5 with only ListGroup. Layer 3 then shrinks to the table family, lists, charts, filters and the tree (lanes 1 and 2), so lanes 3, 4 and 5 should take over table and chart work or end after layer 2.
Product-flavoured generics (kept by default, cheap to drop): AttentionCard, FileRow, PromptEditor, ReadonlyValue, ResultCard, SourceBadges, VariableChip, WorkspaceSwitcher.
Where they live (decided, section 7 item 27): in `shared/ui` under the `flow`, `chat` and `runs` groups, one folder per component.

## 6. Visual deltas to existing components

Public props stay backwards compatible: the defaults reproduce today's primary, md and default. Screens already using these components will look different, so tests and Storybook snapshots need review. v3 changes to everything already built in layers 0 and 1 are in [DELTAS.md](DELTAS.md); this table keeps the repo-to-design view for the seven pre-existing components.

| component | today | design (v3) | action |
|---|---|---|---|
| Button | sm 28, md 34; padded ink-secondary ghost; solid err danger; disabled opacity .55 | xs 22 (ghost text action only), sm 28, md 34, lg 40; primary accent; secondary is card with a line border; danger outlined (`--color-err-line`); ghost is accent text with underline on hover; focus ring outside with 2px gap; disabled is normal colours at .45 with no hover or focus and not-allowed. Active (drawn): hover colours, secondary `--color-chip`. Loading (drawn): spinner 13 before the kept label, width held, `cursor: progress`, `aria-busy`, no ghost loading | extend enums (`xs`, `lg`, ghost, outlined danger); add `loading` and `href`; rewrite scss to tokens |
| Card | `title` prop only; one look | tone default / panel / sunken, pad 12 / 14 / 16, gap, `selected` = 2px accent border plus 4px halo (selection, not focus), `as`, zero padding for tables | add props, keep `title` |
| Dialog | width 440, card bg, padding 20, text close glyph, right-aligned footer | widths sm 560 / md 640 / lg 720 / xl 920; panel bg; divided header, body and footer; 34px icon close; left footer slot; radius 16; dark 1px `--color-overlay-line` border; scrim `--overlay-backdrop`; shadow per theme; z 400 / 410. v3: `busy` (Cancel and close disabled, Esc and scrim ignored), `error` (err Callout at the top of the body, primary becomes the retry), destructive confirm is Button danger | add `size`, `footerLeft`, `busy`, `error`; restyle |
| Field | label `--type-title` ink | label is a 12px mute caption, hint and error 11.5px, gap `--space-5`, error text `--color-err`, error halo `--color-err-light`; required marker, disabled and error+focus drawing are UNDESIGNED | restyle only |
| Input | `min-height`, border-colour-only focus | fixed 34 (md) / 40 (lg); mono option; focus is a 1px accent border plus 3px halo (`--shadow-focus-field`); error border stays err with err-light halo on focus; disabled .45; hover border `--color-edge` (v3); read-only is ReadonlyValue | add `size`, `mono`; new focus, hover and disabled |
| Link | accent link | tone accent / err (`--color-err-ink`), `--type-caption-strong`; standalone links underline on hover only, inline (in a sentence) always underlined; focus ring outside | add `tone` and `inline` |
| PasswordInput | Input plus a visibility toggle | no design; follows Input; the toggle is a ghost IconButton xs 22 (size drawn in v3), and the 61-icon set has no eye icon (UNDESIGNED) | inherits Input changes; icon decision pending |
| Toast | floating, repo styling | drawn on DS-Patterns: 360 card surface with line border, radius 10, popover shadow; tone icon 16 (ok `check` in ok-dot, info `info` in accent, err `alert` in err); 13 message; optional 22 text action; ghost 28 dismiss; bottom-left 16px; newest on top; max 3; 4s, 8s with an action, errors sticky; pause on hover | restyle, move the viewport, timing rule |

## 7. Remaining open questions

Only what the design still leaves open. Everything answered by the designer or drawn on DS-States, DS-Patterns and the dark pages is applied and removed from this list. Answered in v3 and removed: the ThemeToggle form and menu row, the drawer width, shadow and close, the chart palette, legend, two-series hover, tooltip flipping and chart empty/loading, Toast, most control and row hover, Button, IconButton and Composer loading, Button active, Checkbox indeterminate, the Switch dark thumb, SearchInput clear and loading, SelectButton open, PromptEditor focus, error and read-only, DropZone drag-over and error, Avatar image and fallback, EmptyState error, Progress indeterminate and error, table sorting, selection, pagination, row menu, loading, empty and error, ConversationRow unread, FilterBar picker and Clear all, canvas ports, edge drawing and selection, marquee and palette drag, the typing indicator, system messages and delivery failure, the 1.2s pulse, the DropZone "browse" underline, and the Table checked-row vs current-row indicator. Each spec carries a proposal for its own remaining gaps, marked UNDESIGNED or OPEN.

Design still to draw (ask the designer or accept the proposals)
1. **Rail below 1280**: where the workspace switcher, account menu, unread count and pin control go (the pin-open overlay behaviour is drawn, its control is not); whether Sidebar can be collapsed by hand at 1280 and up outside the flow builder, and whether that is remembered per user.
2. **Responsive gaps**: Drawer scrim, outside-click dismissal, Topbar inset and motion; the wizard "Preview" button look; the NarrowScreenNotice layout and body copy; the 1280 boards for Inbox and Quick-start; Inbox queue width (about 340, no token); whether Quick-start is the full-screen WizardFrame or an in-shell wizard (the Responsive board draws it inside the app shell); docked wizard preview 360 (board) or 380 (`--size-wizard-side-width`).
3. **Charts**: multi-series and stacked bars, area fill and dashed comparison, more than 4 series ("Other" in `--chart-muted` proposed), chart keyboard focus, legend hover highlight, Meter hover and threshold tones.
4. **States still not drawn**: Checkbox and Radio error; Field required, disabled and error+focus; Textarea mono (hover follows the field rule); IconButton active and danger; ColorSwatch focus on a selected swatch; FilterChip applied and open; SelectButton sm; PromptEditor disabled and placeholder; DropZone uploading; FileRow uploading and error; hover on the ListHead SortButton and Legend items; Skeleton animation. (The TraceRow, Composer, PaletteItem, EdgeLabel, ZoomControl, FlowNode and TriggerNode states are decided with items 6 and 7.)
5. **Tables and lists**: "Load more" button look; sticky first column when scrolling below 1280. (ConversationRow and RunRow list loading and empty are decided: Skeleton rows while loading, EmptyState when empty.)
6. **Flow canvas** (domain-bound). **Resolved.** Placed edges are orthogonal H/V paths with a filled arrowhead at the target in the edge's colour (`--color-edge`, active or selected `--color-accent`); the edge being drawn is a dashed (5 4) accent cubic curve with no arrowhead. An empty canvas shows EmptyState with "Add a trigger". Releasing a drawn edge on empty canvas opens "Add step", a Menu of PaletteItem rows, pre-connected. Nodes that cannot accept the edge fade to 40%. Ports work by keyboard: Enter starts, arrows cycle the valid targets, Enter connects, Esc cancels. An invalid node gets an `--color-err` border and an `alert` icon. TriggerNode keeps its gap ring, FlowNode its border and halo. Hover: CompactNode, FlowNode and TriggerNode border `--color-edge`; EdgeLabel border `--color-edge`; ZoomControl buttons `--color-soft`; PaletteItem rows `--color-soft`. ZoomControl Fit is 28, PaletteItem rows `--size-row-sm`. TriggerNode gets a 1px `--color-line-node` border in dark if it is too close to the canvas.
7. **Chat and widget** (domain-bound). **Resolved.** No pending or delivered markers; a failure shows only as an error ChatSystemMessage pill. Hand-off (took over, handed back), close and delivery failure are ChatSystemMessage pills; ChatDivider stays for "Flow paused since 14:03" and day changes. ChatStatus in progress shows the `spinner` icon (static under reduced motion). QuickReplies: the chosen pill uses the widget accent inside the widget. WidgetLauncher swaps its icon to `x` when open; its focus ring is a white inner gap plus an accent outer ring. WidgetComposer focus, disabled and sending follow its spec proposal. Customers pick the widget colour in a free colour field with a contrast check. The widget dark theme follows the dashboard tokens. Composer attachments are out of scope. Launcher hover and the live widget's loading, error and offline states have no proposal yet and stay UNDESIGNED in WidgetLauncher and WidgetPreview.
8. **Other undrawn pieces**: Callout and Banner dismiss; Banner action; Tag removable; CountBadge overflow; Stat delta; CodeBlock copy; CodeEditor error and unsaved markers; ReadonlyValue and KeyValue copy affordance; AttentionCard empty, loading and multi-row dividers; Dialog max-height; Breadcrumb truncation; PageHeader action wrapping; which pages use the 460 auth card; Panel and PaneHeader 48px variant usage; Toast stack gap and motion; Progress warn tone. (ChatStatus in progress is decided with item 7.)
9. **Motion**: spinner speed (proposal 800ms linear); open and close motion for menus, drawers, dialogs and toasts (token-based proposals in each spec).
10. **Missing icons**: no eye icon for PasswordInput, and no trash, download or external-link icon (DS-Patterns uses `x` for Delete). Add them to the set, or use text buttons?

Drawn sources that disagree (OPEN; each spec uses the stated proposal)
11. **Dialog spacing**: DS-States draws header and body 16 20, footer 12 20, close ghost sm 28 and title tracking -0.01em; DS-Navigation draws 18 22 / 14 22, close md 34 and no tracking. Proposal: Navigation values.
12. **PromptEditor font**: DS-States uses JetBrains Mono 13 at line-height 1.7; tokens.md uses sans `--type-body` at `--leading-relaxed` 1.45. Proposal: tokens.
13. **Badge and Topbar dots**: every page, DS-States and DS-Patterns included, draws the dot in the text colour (`--color-ok`, `--color-warn`); the written rule says dot tokens (`--color-ok-dot`, `--color-warn-dot`). Proposal: dot tokens.
14. **Row and control heights against the 28 rule**: SegmentedControl and ThemeToggle draw about 31 (md, settings) and 25 (sm, menu); TreeFolder rows 30 (kept as `--size-row-sm`). Proposal: 28 and 22. (ZoomControl Fit 28 and PaletteItem rows `--size-row-sm` are decided with item 6.)
15. **Button label weight**: the page CSS puts `font-weight: 600` before `font: inherit`, so every label (primary included, e.g. "Try again") renders at 400. Proposal: 600 for primary, secondary and danger.
16. **Table header and padding**: DS-Patterns draws the header at 11.5/600 with 8px 14px padding and rows at 10px 14px; DS-Data draws 11.5/400 with 16px sides. The sort arrow is drawn in ink although the rule text says "accent arrow". Row menu column is 28 (DS-States) or 36 (DS-Patterns). Proposal: 600, 14px sides for checkbox tables and 16px otherwise, ink arrow, 36px column.
17. **Filter and chart spacing**: FilterBar gap 6 (DS-Patterns) or 8 (DS-Data); the DS-Data filter bar still draws "Last 24 h" as a chip, while the rule says single-value filters use a SegmentedControl; ChartCard gap 12 with a legend, 10 / 8 on DS-Data; TableCellLead md 28 on DS-Patterns alongside lg 34. Proposals are in each spec.
18. **Callout err icon**: DS-Display uses `esc`; DS-Patterns (table error), Toast and EmptyState use `alert`. Proposal: `alert`.
19. **Text on the widget accent in dark**: DS-Dark-Flow-Chat draws #FFFFFF; DS-Dark-Patterns draws `--color-on-accent` #0B1F1D. **Resolved:** #FFFFFF on a customer accent, `--color-on-accent` only when the widget uses the product accent.
20. **FlowCanvas grid**: DS-Flow-Chat draws a 20px dot grid on `--color-bg`; the DS-Patterns boards draw 18px on `--color-card` with a solid frame. **Resolved:** 20 on bg (the boards are frames).

Token and value confirmations
21. **Selection halo**: the Display page draws only the 2px border on selected cards; the 4px halo (`--shadow-selected`) comes from the designer's written answer. Confirm both.
22. **`--layout-lead-width`**: Foundations says 620; the Display page lead sample uses 760.
23. **Focus ring gap colour**: `--shadow-focus-ring` uses `--color-card` as drawn (DS-States confirms it in dark). On panel and bg surfaces it still reads; confirm that a per-surface gap is not wanted.
24. **Locales**: which ship (the language SegmentedControl appears on every page)? Is `en` plus `uk` the final set?

Engineering decisions (ADRs before layer 3)
25. Flow canvas: React Flow or a custom canvas (ports, drag and drop, marquee, selection, a11y).
26. Chart library or hand-rolled SVG (crosshair, multi-row tooltip, legend toggle); rich editors for PromptEditor (Tiptap or Lexical) and CodeEditor (CodeMirror or Monaco).
27. Where domain-bound components live. **Resolved:** in `shared/ui` under the `flow`, `chat` and `runs` groups.
28. Fonts: the design uses static Onest and JetBrains Mono; the repo uses variable fonts. Accept variable?
29. Theme preference storage: a user setting on the backend (the designer says "stored on the user"); the contract and GraphQL field are outside this spec.
30. Per-screen component usage (Button and IconButton variants) is inferred, not verified. Do you want a screen-by-component matrix before layer 2?
