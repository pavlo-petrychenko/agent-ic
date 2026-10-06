import clsx from 'clsx';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { NODE_HEADER_INVALID_ICON_SIZE } from '@/shared/ui/flow/NodeHeader/NodeHeader.constants';
import type { NodeHeaderProps } from '@/shared/ui/flow/NodeHeader/NodeHeader.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/flow/NodeHeader/NodeHeader.module.scss';

export function NodeHeader({
  kind,
  overline,
  name,
  icon = null,
  invalidLabel = null,
  className,
}: NodeHeaderProps) {
  return (
    <div className={clsx(styles.root, styles[kind], className)}>
      <NodeTile kind={kind} icon={icon} size={TileSize.Sm} />
      <span className={styles.text}>
        <span className={styles.overline}>{overline}</span>
        <span className={styles.name}>{name}</span>
      </span>
      {invalidLabel !== null && (
        <Icon
          name={IconName.Alert}
          title={invalidLabel}
          size={NODE_HEADER_INVALID_ICON_SIZE}
          className={styles.invalid}
        />
      )}
    </div>
  );
}
