# Menu
Purpose: floating list of options (listbox) for pickers, the variable/field chooser, the workspace switcher and account menu; also the visual base for dropdown action menus.
Source (states): drawn on DS-States (light) and DS-Dark-States (dark; colours are the tokens.md dark values).

## Anatomy
div[role=listbox] > option rows (label, optional hint / avatar + two lines / trailing check).

## Variants
- width param (280 in design: `--size-menu-width`; 220 for the filter picker, 180 for row actions, trigger width for SelectButton). The row-actions and account menus below are compositions owned by Table and WorkspaceSwitcher (items + width), not Menu variants.
- rows: simple (mono label + right hint) | rich (Avatar 24 + title/subtitle + trailing check) | action (drawn on DS-States: leading icon 14 + label 12.5, gap `--space-8`; trailing hint 11 `--color-mute` or shortcut mono 11 `--color-ink-secondary`, e.g. `⌘D`)
- section label (drawn): Overline (11/600 uppercase, `--tracking-overline`, `--color-mute`), padding `--space-8` `--space-8` `--space-4`
- separator (drawn): 1px `--color-line`, full width, no margin; placed before destructive items
- row actions (drawn on DS-Patterns > Table): width 180, action rows Open (`chevron-right`), Pause (`pause`), Delete (`x`; label `--color-err`, the icon stays ink here while DS-States draws it err: follow DS-States); no separator drawn before Delete. Opens below-right of the ••• trigger and flips up near the bottom of the viewport.
- account menu (drawn on DS-Patterns > Theme): width 280; rows Profile (`user` 14, hint = user name), Theme (`moon` 14, trailing ThemeToggle `menu` variant in place of the hint), Log out (`x` 14). See ThemeToggle, WorkspaceSwitcher.

## States (drawn on DS-States / DS-Dark-States)
- default: transparent.
- hover: bg `--color-soft`.
- selected: bg `--color-accent-light`; action menus show a leading `check` 14 (listbox pickers use a trailing check, see SelectButton).
- keyboard focus = the hover style (one highlighted item at a time); no ring on items (changed: the previous spec added an inset ring for keyboard).
- disabled item: 45%, no hover, not-allowed, skipped by arrow keys; it keeps a reason in the trailing slot (11 `--color-mute`, "not published").
- danger item: label and icon `--color-err` (icon stroke err), no tint; sits after a separator.
- open/close: fade plus 4px translate, `--duration-base` (200) `--ease-enter`, exit about 160ms `--ease-exit`; reduced motion: opacity only (not on DS-States; kept).

## Props
```ts
interface MenuItem { id: string; label: string; hint: string | null; shortcut: string | null; mono: boolean; leading: ReactNode | null; trailing: ReactNode | null; disabled: boolean; danger: boolean }
interface MenuProps { items: MenuItem[]; selectedId: string | null; onSelect: (id: string) => void; width: number | null; ariaLabel: string }
```

## Tokens
bg `--color-card`; border `--border-width` `--color-line`; radius `--radius-10`; shadow `--shadow-popover` (dark: 0 12px 32px .55); z `--z-dropdown` (100; inside a Popover it inherits `--z-popover` 200); padding `--space-6`; gap `--space-2`; option padding `--space-7` `--space-8`, radius `--radius-6`; label mono `--type-mono` or `--type-body`; hint `--type-hint` (11) `--color-mute`; rich title `--type-title`, subtitle `--type-caption` `--color-mute`.

## Accessibility
Selection pickers: role=listbox/option with aria-selected, Arrow/Home/End, type-ahead, Enter selects, Escape closes, focus returns to the trigger. Action menus (no persisted selection): Radix DropdownMenu (role=menu/menuitem). The design page shows no role=menu usage. Keep Radix inside shared/ui.

## Light/dark
Token-driven; the dark shadow is stronger (shadow token per theme).

## Used by
DS-Navigation (Menu & tooltip), DS-Inputs (listbox), MVP-Agents-AccountMenu, DS-Patterns (table row menu, filter picker, account menu).

## Differs from current web
New in v2. `--shadow-popover` must carry its dark value in tokens.css (0 12px 32px rgba(0,0,0,.55), drawn on DS-Dark-Inputs, -Navigation, -States, -Patterns); verify it in layer 0, it is already in tokens.md.
