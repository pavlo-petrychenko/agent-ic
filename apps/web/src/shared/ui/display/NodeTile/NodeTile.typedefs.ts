import type { ComponentProps } from 'react';
import type { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface NodeTileProps extends Omit<ComponentProps<'span'>, 'children'> {
  kind?: NodeKind;
  size?: TileSize;
  icon?: IconName | null;
  label?: string | null;
}
