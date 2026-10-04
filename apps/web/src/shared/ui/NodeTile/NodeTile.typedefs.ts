import type { ComponentProps } from 'react';
import type { IconName } from '@/shared/ui/Icon/Icon.constants';
import type { NodeKind, TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';

export interface NodeTileProps extends Omit<ComponentProps<'span'>, 'children'> {
  kind?: NodeKind;
  size?: TileSize;
  icon?: IconName | null;
  label?: string | null;
}
