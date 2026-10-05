# SourceBadges
Purpose: show where a contact-field value came from; group of Badges.
Anatomy: flex gap 4 (--space-4) wrap > Badge[].
Mapping (source -> Badge tone): Channel -> neutral, Flow -> violet, Operator -> accent, API -> warn, System -> neutral.
Props: { sources: SourceKind[] } enum SourceKind = CHANNEL | FLOW | OPERATOR | API | SYSTEM. Composes Badge; no own styling.
A11y: as Badge; the group is a list of text, source names are visible text. States: static. Used inside PropRow (see KeyValue.md). Light/dark: via Badge. Page: DS-Display.dc.html.
