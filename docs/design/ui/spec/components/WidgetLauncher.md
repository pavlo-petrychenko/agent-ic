# WidgetLauncher
Purpose: floating round button opening the web widget.
Anatomy: 52x52 circle, chat icon, shadow 0 6px 16px accent@35%. Placed right 24, bottom 24.
States: default drawn on the page. open (decided): the icon swaps to `x`. focus-visible (decided): a white inner gap and an outer ring in the widget accent. disabled: n/a. hover: UNDESIGNED. Product accent is teal only; the widget colour is a customer setting, not a product accent (the page still offers three colours; blue/violet values are not kept as tokens: decided: the customer picks the colour in a free colour field with a contrast check against #FFFFFF, the text colour on a customer accent).
Props: `{ accent: string; open: boolean; onToggle }`.
Tokens: bg runtime accent; icon #FFFFFF literal in both themes (drawn on DS-Dark-Flow-Chat; not `--color-on-accent`); shadow is a local constant 0 6px 16px widget accent at 35% (rgba(15,107,107,.35) for teal), unchanged in dark.
A11y: button aria-label "Open chat", aria-expanded, aria-controls panel.
Light/dark: the launcher itself is identical in both themes (DS-Dark-Flow-Chat); the dashboard stage uses --color-soft (#2A2824 dark).
Used: DS-Flow-Chat.
