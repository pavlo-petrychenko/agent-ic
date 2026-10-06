import clsx from 'clsx';
import { ADD_TILE_ICON_SIZES, AddTileLayout } from '@/shared/ui/actions/AddTile/AddTile.constants';
import type { AddTileProps } from '@/shared/ui/actions/AddTile/AddTile.typedefs';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/shared/ui/actions/AddTile/AddTile.module.scss';

export function AddTile({
  label,
  sub = null,
  layout = AddTileLayout.Row,
  type = 'button',
  className,
  ...rest
}: AddTileProps) {
  const showSub = layout === AddTileLayout.Tile && sub !== null;

  return (
    <button {...rest} type={type} className={clsx(styles.root, styles[layout], className)}>
      <Icon name={IconName.Plus} size={ADD_TILE_ICON_SIZES[layout]} />
      <span className={styles.label}>{label}</span>
      {showSub ? <span className={styles.sub}>{sub}</span> : null}
    </button>
  );
}
