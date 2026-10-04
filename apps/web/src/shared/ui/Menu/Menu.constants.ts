export enum MenuKey {
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
  Home = 'Home',
  End = 'End',
  Enter = 'Enter',
  Space = ' ',
}

export enum MenuStep {
  Next = 1,
  Previous = -1,
}

export enum MenuVariant {
  Listbox = 'listbox',
  Action = 'action',
}

export enum MenuEntryKind {
  Option = 'option',
  Section = 'section',
  Separator = 'separator',
}

export const NOT_FOUND_INDEX = -1;
export const MENU_TYPEAHEAD_RESET_MS = 500;
export const MENU_CHECK_ICON_SIZE = 14;
