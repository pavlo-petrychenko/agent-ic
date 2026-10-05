import clsx from 'clsx';
import type { IconRowProps } from '@/shared/ui/IconRow/IconRow.typedefs';
import { NodeTile } from '@/shared/ui/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';
import styles from '@/shared/ui/IconRow/IconRow.module.scss';

export function IconRow({
  icon,
  label,
  tone = NodeKind.Neutral,
  trailing = null,
  className,
  ...rest
}: IconRowProps) {
  return (
    <div {...rest} className={clsx(styles.root, className)}>
      <NodeTile kind={tone} size={TileSize.Sm} icon={icon} />
      <span className={styles.label}>{label}</span>
      {trailing !== null && <span className={styles.trailing}>{trailing}</span>}
    </div>
  );
}
