export enum AddTileLayout {
  Row = 'row',
  Tile = 'tile',
}

export const ADD_TILE_ICON_SIZES: Readonly<Record<AddTileLayout, number>> = {
  [AddTileLayout.Row]: 13,
  [AddTileLayout.Tile]: 18,
};
