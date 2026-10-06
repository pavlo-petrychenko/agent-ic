import type { ComponentProps, ReactNode } from 'react';
import type { MenuItem } from '@/shared/ui/overlays/Menu';

export interface SelectButtonProps extends Omit<
  ComponentProps<'button'>,
  'value' | 'children' | 'onSelect' | 'type'
> {
  value: string;
  context?: string | null;
  label?: string | null;
  icon?: ReactNode | null;
  mono?: boolean;
  invalid?: boolean;
  error?: string | null;
  disabled?: boolean;
  open?: boolean | null;
  onOpenChange?: ((open: boolean) => void) | null;
  options?: readonly MenuItem[] | null;
  selectedId?: string | null;
  onSelect?: ((id: string) => void) | null;
  menuLabel?: string | null;
}
