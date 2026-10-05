import type { ComponentProps, ReactNode } from 'react';

export interface FileRowProps extends Omit<ComponentProps<'li'>, 'children'> {
  icon: ReactNode;
  name: string;
  subtitle: string;
  status?: ReactNode | null;
  removeLabel: string;
  onRemove: () => void;
  disabled?: boolean;
}
