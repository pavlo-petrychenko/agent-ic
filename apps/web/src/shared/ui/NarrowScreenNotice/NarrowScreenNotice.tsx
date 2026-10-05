import clsx from 'clsx';
import type { NarrowScreenNoticeProps } from '@/shared/ui/NarrowScreenNotice/NarrowScreenNotice.typedefs';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/NodeTile';
import styles from '@/shared/ui/NarrowScreenNotice/NarrowScreenNotice.module.scss';

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
