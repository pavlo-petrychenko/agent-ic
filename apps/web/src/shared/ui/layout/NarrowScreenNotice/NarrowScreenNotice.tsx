import clsx from 'clsx';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/display/NodeTile';
import type { NarrowScreenNoticeProps } from '@/shared/ui/layout/NarrowScreenNotice/NarrowScreenNotice.typedefs';
import styles from '@/shared/ui/layout/NarrowScreenNotice/NarrowScreenNotice.module.scss';

export function NarrowScreenNotice({
  title,
  description = null,
  className,
  ...rest
}: NarrowScreenNoticeProps) {
  return (
    <main {...rest} className={clsx(styles.root, className)}>
      <NodeTile kind={NodeKind.Accent} size={TileSize.Md} aria-hidden="true" />
      <h1 className={styles.title}>{title}</h1>
      {description !== null && <p className={styles.description}>{description}</p>}
    </main>
  );
}
