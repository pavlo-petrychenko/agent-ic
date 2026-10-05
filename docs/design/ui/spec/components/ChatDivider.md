# ChatDivider
Purpose: full-width thread separator with a caption: a paused flow ("Flow paused since 14:03", DS-Flow-Chat) and day changes.
Anatomy: flex row gap 8: 1px rule (flex-grow), pause icon 12px, caption 12px, rule.
Tokens: rule `--color-line`; text/icon `--color-mute`; `--type-caption`; `--space-8`.
Props: `{ text: string; icon: ReactNode | null }`. Icon on the page: `pause` (12px). States: static; not interactive.
A11y (decided): plain text in the thread, no `role="separator"` (a separator cannot hold the caption and the lint rule asks for `hr`); the rules and the icon are `aria-hidden`.
Light/dark: tokens swap (--color-line, --color-mute dark values). Other divider events: DS-Patterns > Chat extras draws hand-off ("Pavlo took over · 14:05", `hand`) and closing ("Chat closed by Pavlo · 14:12", `check`) as centred ChatSystemMessage pills, not as full-width dividers. Decided: ChatDivider stays, for "Flow paused since 14:03" and day changes. Hand-off (took over, handed back), close and delivery failure are ChatSystemMessage pills.
Used: DS-Flow-Chat.
