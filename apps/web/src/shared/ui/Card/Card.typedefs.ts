import type { HTMLAttributes, ReactNode } from 'react';
import type { CardElement, CardGap, CardPad, CardTone } from '@/shared/ui/Card/Card.constants';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: string | null;
  tone?: CardTone;
  pad?: CardPad | null;
  gap?: CardGap | null;
  selected?: boolean;
  flush?: boolean;
  as?: CardElement;
  children: ReactNode;
}
