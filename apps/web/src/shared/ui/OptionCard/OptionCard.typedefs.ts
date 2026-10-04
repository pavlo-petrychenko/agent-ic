import type { ReactNode } from 'react';

export interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  title: string;
  description?: ReactNode | null;
  children?: ReactNode | null;
}
