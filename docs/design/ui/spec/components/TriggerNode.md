# TriggerNode
Purpose: dark flow entry node ("Incoming message") listing the channels.
Anatomy: card, header row (icon 14px + title 600), subtitle line. Size 248x72, pad 11x14, gap 4.
Variants: single. Sizes: fixed width 248. States: selected (designed): `0 0 0 2px --color-card, 0 0 0 4px --color-accent` ring around the dark card (the page draws a gap ring here instead of a 2px border, because the fill is dark). This differs from FlowNode (2px border + halo) on purpose (decided: keep the gap ring as drawn). focus-visible: outside ring, 2px gap. disabled: 45%. hover (decided): border `--color-edge`. No input port (entry only): drawn rule on DS-Patterns, "Triggers have only an out-port"; while an edge is being drawn the trigger is "not a target" and fades to 40% opacity. Other trigger types (Schedule / cron: icon `cal`, subtitle "Daily 18:00"; External event: icon `bolt`) share the same card, only icon and text change.
Props: `{ title: string; subtitle: string | null; selected: boolean; icon: ReactNode }`.
Tokens: bg `--color-dark`; title colour `--color-on-dark`, subtitle `--color-on-dark-secondary`; radius `--radius-12`; title `--type-title`; subtitle `--type-caption`; gap `--space-8`/`--space-4`.
A11y: role=group + aria-label, focusable; not a Radix case.
Light/dark: bg `--color-dark` and text `--color-on-dark` / `--color-on-dark-secondary` have dark values in tokens.md. Decided: if the dark fill is too close to the dark canvas, add a 1px `--color-line-node` border in dark.
Used: DS-Flow-Chat canvas.
Dark (drawn on DS-Dark-Flow-Chat): bg #3A3631, title #F2EEE7, subtitle #CFCAC1, no shadow; selected ring `0 0 0 2px #211F1C, 0 0 0 4px #4DB6AE`.
