import clsx from 'clsx';
import { Icon } from '@/shared/ui/Icon/Icon';
import {
  NODE_KIND_DEFAULT_ICONS,
  NodeKind,
  TILE_ICON_SIZES,
  TileSize,
} from '@/shared/ui/NodeTile/NodeTile.constants';
import type { NodeTileProps } from '@/shared/ui/NodeTile/NodeTile.typedefs';
import styles from '@/shared/ui/NodeTile/NodeTile.module.scss';

export function NodeTile({
  kind = NodeKind.Neutral,
  size = TileSize.Md,
  icon = null,
  label = null,
  className,
  ...rest
}: NodeTileProps) {
  const standalone = label === null && rest['aria-label'] !== undefined;

  return (
    <span {...rest} role={standalone ? 'img' : undefined} className={clsx(styles.root, className)}>
      <span className={clsx(styles.tile, styles[kind], styles[size])}>
        <Icon name={icon ?? NODE_KIND_DEFAULT_ICONS[kind]} size={TILE_ICON_SIZES[size]} />
      </span>
      {label !== null && <span className={styles.label}>{label}</span>}
    </span>
  );
}
