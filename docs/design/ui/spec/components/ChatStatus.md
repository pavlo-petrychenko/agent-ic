# ChatStatus
Purpose: transient system status pill in the thread ("Tool event run is writing the confirmation…").
Anatomy: right-aligned pill, icon 13px (`tool-event`, renamed from toolev) + text, gap 8, pad 6x12, 12px.
Tokens: bg `--color-card`; border 1px dashed `--color-line`; text `--color-mute`; `--radius-pill`; `--type-caption`.
Props: `{ text: string; icon: ReactNode }`.
A11y: role=status aria-live=polite.
Light/dark: tokens swap. Static, not interactive. In progress (decided): the icon is replaced by `spinner`, which turns; it is static under reduced motion. Typing indicator is a separate component, drawn on DS-Patterns (see TypingIndicator); system events are ChatSystemMessage.
Used: DS-Flow-Chat.
