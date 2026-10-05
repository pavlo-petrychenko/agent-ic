import { AvatarSize } from '@/shared/ui/Avatar/Avatar.constants';
import { TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';

export enum TableCellLeadKind {
  Icon = 'icon',
  Avatar = 'avatar',
}

export enum TableCellLeadSize {
  Md = 'md',
  Lg = 'lg',
}

export const TABLE_CELL_LEAD_TILE_SIZES: Readonly<Record<TableCellLeadSize, TileSize>> = {
  [TableCellLeadSize.Md]: TileSize.Md,
  [TableCellLeadSize.Lg]: TileSize.Lg,
};

export const TABLE_CELL_LEAD_AVATAR_SIZES: Readonly<Record<TableCellLeadSize, AvatarSize>> = {
  [TableCellLeadSize.Md]: AvatarSize.Sm,
  [TableCellLeadSize.Lg]: AvatarSize.Md,
};
