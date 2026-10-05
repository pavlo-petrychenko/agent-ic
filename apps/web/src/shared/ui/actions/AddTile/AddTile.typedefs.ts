import type { ComponentProps } from 'react';
import type { AddTileLayout } from '@/shared/ui/actions/AddTile/AddTile.constants';

export interface AddTileProps extends Omit<ComponentProps<'button'>, 'children'> {
  label: string;
  sub?: string | null;
  layout?: AddTileLayout;
}
