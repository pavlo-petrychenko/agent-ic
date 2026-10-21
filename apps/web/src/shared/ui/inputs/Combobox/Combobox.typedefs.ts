import type { ComponentProps } from 'react';

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly group?: string;
}

export interface ComboboxGroupAction {
  readonly label: string;
  readonly onSelect: () => void;
}

export interface ComboboxGroup {
  readonly id: string;
  readonly label: string;
  readonly hint?: string | null;
  readonly action?: ComboboxGroupAction | null;
  readonly creatable?: boolean;
}

export interface ComboboxSection {
  readonly group: ComboboxGroup | null;
  readonly options: readonly ComboboxOption[];
}

export interface ComboboxProps extends Omit<
  ComponentProps<'button'>,
  'value' | 'onChange' | 'children' | 'type'
> {
  value: string;
  options: readonly ComboboxOption[];
  onChange: (value: string) => void;
  searchLabel: string;
  searchClearLabel: string;
  emptyLabel: string;
  createLabel?: ((query: string) => string) | null;
  onCreate?: ((query: string, group: string | null) => void) | null;
  groups?: readonly ComboboxGroup[];
  placeholder?: string | null;
  invalid?: boolean;
  error?: string | null;
}
