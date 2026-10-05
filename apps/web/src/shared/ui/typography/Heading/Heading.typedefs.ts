import type { ComponentProps } from 'react';
import type { HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading/Heading.constants';

export interface HeadingProps extends ComponentProps<'h2'> {
  size?: HeadingSize;
  as?: HeadingElement | null;
  nowrap?: boolean;
}
