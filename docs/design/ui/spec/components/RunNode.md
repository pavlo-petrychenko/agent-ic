# RunNode
Purpose: compact node in the simulator/live-run mini flow showing run state.
Anatomy: 220x36 row, radius 9, pad 0 9, gap 7, 11.5px; tile 18px radius 6 with kind icon (13/11px), name 500 ellipsis, trailing status.
States: done (dark bg `--color-dark`, text `--color-on-dark` (#FFFFFF light, #F2EEE7 dark), border `--color-ok-line`, check `--color-ok-on-dark`); running (card bg, 2px accent border, 4px halo `--shadow-selected`, trailing "running" 10.5px/600 `--color-accent-dark`; the new `spinner` icon is available, proposal: show it before the word); waiting (card, 1px dashed `--color-line-dash`, opacity .75); skipped/not reached (card, `--color-line` border, opacity .5).
Props: `{ name: string; kind: NodeKind; state: 'done' | 'running' | 'waiting' | 'skipped' }`.
Tokens: `--color-dark`, `--color-card`, `--color-accent`, `--shadow-selected`, `--radius-6`, `--type-small`. Also `--color-ok-line`, `--color-ok-on-dark` (both have dark values in tokens.md). Local constants (not tokens): radius 9, opacities .75/.5.
A11y: role=listitem, state as text for SR (aria-label "Name, running"); running uses aria-busy; no Radix.
Light/dark: done state keeps `--color-dark` with the green check; dark theme swaps all three tokens (`--color-dark` #3A3631, `--color-ok-line` #2F5A44, `--color-ok-on-dark` #6FCB9C); nothing left undesigned here (confirmed on DS-Dark-Flow-Chat: #3A3631 bg, #F2EEE7 text, #2F5A44 border). Not interactive on the page; if clickable, focus-visible = outside 2px-gap ring and disabled = 45% (note: the 'waiting' .75 and 'skipped' .5 opacities are state styling, not the disabled rule).
Used: DS-Flow-Chat (Live run nodes); likely also Traces pages.
