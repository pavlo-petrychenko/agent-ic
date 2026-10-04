import type { ComponentProps } from 'react';
import type { TagKind } from '@/shared/ui/Tag/Tag.constants';

export interface TagProps extends ComponentProps<'span'> {
  kind?: TagKind;
  mono?: boolean | null;
}
