# ThemeToggle
Purpose: choose the colour theme: Light, Dark or System.
Pages: drawn on DS-Patterns > Theme > Theme switch (light) and DS-Dark-Patterns (dark): the account-menu row and Settings > Profile. The v2 proposal (radiogroup with icon + label) is replaced by what the page draws.

## Decided (designer)
- Options: Light (`sun`), Dark (`moon`), System (`monitor`). Order Light, Dark, System.
- Per person, stored on the user (server-side, not only localStorage). System follows `prefers-color-scheme`. Applied before first paint (no flash) (drawn rule).
- Locations: account menu and Settings > Profile (both drawn).

## Anatomy (drawn on DS-Patterns)
group (`role="group"`, `aria-label="Theme"`; inline-flex; align-self flex-start; border `--border-width` `--color-line`; radius `--radius-8`; overflow hidden; bg `--color-card`) > 3 `aria-pressed` buttons (no border, no radius, no dividers). This is the SegmentedControl look, drawn twice:
- menu (account menu Theme row, icons only): buttons padding `--space-4` `--space-7`, icon 11 (stroke 1.5), font 11; drawn height about 25. Each icon-only button carries an aria-label and a Tooltip: "Light", "Dark", "System" (drawn rule).
- settings (Settings > Profile, text only, no icons): buttons padding `--space-6` `--space-11`, `--type-caption` 12, labels "Light", "Dark", "System"; drawn height about 31. Wrapped like a Field: label "Theme" (12, `--color-mute`), gap `--space-5`, help text "System follows your computer’s setting" (`--type-small` 11.5, `--color-mute`); width 300 in the sample.

## Menu row (drawn)
Menu (width 280) row: leading `moon` 14 + label "Theme" (`--type-body-small` 12.5, gap `--space-8`) left, the icon-only group right (where other rows show their hint). Rows around it: "Profile" (`user`, hint = user name) and "Log out" (`x`). See Menu and WorkspaceSwitcher.

## States
- selected (`aria-pressed="true"`): bg `--color-chip`, text/icon `--color-ink`, weight 600.
- rest: transparent, `--color-mute`, weight 400.
- hover, focus-visible, disabled: as SegmentedControl (drawn on DS-States: hover `--color-soft` + ink; focus ring inset `--shadow-focus-ring-inset`; disabled group 45%).
Heights 25 and 31 are off the 28 grid, the same open question as SegmentedControl (INDEX section 7, item 14); proposal unchanged: 22 (menu) and 28 (settings).

## Props
```ts
enum ThemePreference { Light = 'light', Dark = 'dark', System = 'system' }
enum ThemeToggleVariant { Menu = 'menu', Settings = 'settings' }
type ThemeToggleProps = { value: ThemePreference; onChange: (value: ThemePreference) => void; variant: ThemeToggleVariant; labels: Record<ThemePreference, string>; ariaLabel: string }
```
`menu` renders icons with `labels` as aria-label and Tooltip text; `settings` renders `labels` as text.

## Accessibility
The page uses `role="group"` with `aria-pressed` buttons (as SegmentedControl). Add arrow-key navigation (Radix ToggleGroup type="single" inside `shared/ui`, guarding the empty value). Inside the menu row the control must not be swallowed by the menu's own arrow-key handling: Tab into it, arrows switch within it. Announce the change through the pressed state.

## Light/dark
Drawn on DS-Dark-Patterns: group bg `--color-card` #211F1C, border `--color-line` #34312C, selected `--color-chip` #322F2A with `--color-ink` #ECE8E1, rest `--color-mute` #A29C92.

## Repo diff
Layer 0 shipped a theme store and a v2 radiogroup ThemeToggle. Rebuild the control to the drawn group above. It still does not import SegmentedControl (it copies its tokens), but the `menu` variant now wraps each segment in `Tooltip` (layer 1, lane 3), so this change lands after lane 3's Tooltip delta (see DELTAS.md, layer 0). Backend user preference field: still outside this scope.
