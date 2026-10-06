import type { ComponentProps } from 'react';
import type { TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text/Text.constants';

export interface TextProps extends Omit<ComponentProps<'p'>, 'color'> {
  kind?: TextKind;
  color?: TextColor | null;
  as?: TextElement;
  tabularNums?: boolean;
}
