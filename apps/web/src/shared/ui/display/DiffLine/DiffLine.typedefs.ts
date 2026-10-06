import type { ComponentProps } from 'react';
import type { DiffSign } from '@/shared/ui/display/DiffLine/DiffLine.constants';

export interface DiffLineProps extends ComponentProps<'li'> {
  sign: DiffSign;
  signLabel: string;
}
