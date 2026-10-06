import type { ComponentProps } from 'react';
import type {
  SubnavItemDepth,
  SubnavItemMetaKind,
} from '@/shared/ui/data/SubnavItem/SubnavItem.constants';

export interface SubnavItemAnchorProps extends Omit<ComponentProps<'a'>, 'children'> {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  meta?: string | null;
  metaKind?: SubnavItemMetaKind;
  depth?: SubnavItemDepth;
}
