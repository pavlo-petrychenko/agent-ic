import type { ComponentProps } from 'react';

export interface ColorSwatchProps extends Omit<ComponentProps<'button'>, 'color' | 'onSelect'> {
  color: string;
  label: string;
  selected?: boolean;
  onSelect: () => void;
}
