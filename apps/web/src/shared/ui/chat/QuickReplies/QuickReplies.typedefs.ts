import type { ComponentProps } from 'react';

export interface QuickRepliesProps extends Omit<
  ComponentProps<'fieldset'>,
  'children' | 'onSelect'
> {
  label: string;
  options: readonly string[];
  chosen: string | null;
  onChoose: (option: string) => void;
  disabled?: boolean;
  accent?: string | null;
}
