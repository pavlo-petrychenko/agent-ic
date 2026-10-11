import type { ComponentProps } from 'react';

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
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
  placeholder?: string | null;
  invalid?: boolean;
  error?: string | null;
}
