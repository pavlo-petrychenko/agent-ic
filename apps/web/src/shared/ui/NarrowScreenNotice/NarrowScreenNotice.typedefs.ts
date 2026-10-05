import type { ComponentProps } from 'react';

export interface NarrowScreenNoticeProps extends Omit<ComponentProps<'main'>, 'title'> {
  title: string;
  description?: string | null;
}
