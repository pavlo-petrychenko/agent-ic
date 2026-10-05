# Design system: names in the design and in the code

Every component in `apps/web/src/shared/ui/` has one name, the folder name. Some design pages draw the same component under another name. This page maps them, so a designer and a developer can find the same thing.

The design pages are DS-Foundations, DS-Actions, DS-Inputs, DS-Navigation, DS-Display, DS-Data, DS-Flow-Chat, DS-States and DS-Patterns, each with a DS-Dark-\* twin.

## Design name → component

| Name on the design pages                                                                        | Page                       | Component in `shared/ui`       |
| ----------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------ |
| `text_input`, TextField                                                                         | DS-Inputs, DS-Foundations  | Input                          |
| Toggle                                                                                          | DS-Inputs                  | Switch                         |
| StatusPill                                                                                      | DS-Navigation, DS-Data     | Badge                          |
| NodeChip                                                                                        | DS-Flow-Chat               | Tag                            |
| NodeCallout                                                                                     | DS-Flow-Chat               | Callout                        |
| TypeTile                                                                                        | DS-Display                 | NodeTile                       |
| IconTile                                                                                        | DS-Data, DS-Navigation     | NodeTile                       |
| SourceTile                                                                                      | DS-Navigation              | OptionCard                     |
| Dropzone                                                                                        | DS-Navigation              | DropZone                       |
| `var_token`                                                                                     | DS-Inputs                  | VariableChip                   |
| `readonly`                                                                                      | DS-Inputs                  | ReadonlyValue                  |
| `search`                                                                                        | DS-Inputs                  | SearchInput                    |
| Tabs, Breadcrumb, Stepper, Tooltip, Avatar, IconButton, SegmentedControl in `alt-DS-Navigation` | alt-DS-Navigation (a copy) | the component of the same name |

Every other component has the same name on the design pages and in the code.

## Components that are part of another component's design

These have their own folder in the code, but the design draws them inside another component.

| Component    | Drawn as part of      |
| ------------ | --------------------- |
| AvatarStack  | Avatar                |
| SkeletonBox  | Skeleton              |
| NavGroup     | Sidebar               |
| FilterPicker | FilterBar, FilterChip |

## In the code only

| Component     | Note                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| PasswordInput | built before the design system; follows Input. The design has no eye icon for its show/hide button yet |

## Easy to confuse

These are separate components on purpose:

| Pair                     | Difference                                                   |
| ------------------------ | ------------------------------------------------------------ |
| Banner · Callout · Toast | an edge-to-edge strip · an inline block · a floating message |
| Meter · Progress         | a measurement · progress of a task                           |
| ChartTooltip · Tooltip   | a chart's own anchor · a control's hint, same tokens         |
| LinkedItem · LinkCard    | a dashed row link · a vertical card                          |
| DisplayTitle · Heading   | a page's display title · a section heading                   |
| ListItem · NavItem       | a list row (also the SecondaryNav row) · a sidebar entry     |
| Drawer · Panel           | a host for narrow screens · a docked pane                    |
| AttentionCard · Notice   | a card of several Notice rows · one notice                   |
