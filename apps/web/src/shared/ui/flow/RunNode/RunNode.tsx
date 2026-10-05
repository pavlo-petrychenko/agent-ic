import clsx from 'clsx';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import {
  RUN_NODE_STATUS_ICON_SIZE,
  RUN_NODE_STATUS_ICONS,
  RUN_NODE_VISIBLE_LABEL_STATES,
  RunNodeState,
} from '@/shared/ui/flow/RunNode/RunNode.constants';
import type { RunNodeProps } from '@/shared/ui/flow/RunNode/RunNode.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/flow/RunNode/RunNode.module.scss';

export function RunNode({ name, kind, state, stateLabel, icon = null, className }: RunNodeProps) {
  const statusIcon = RUN_NODE_STATUS_ICONS[state];
  const labelVisible = RUN_NODE_VISIBLE_LABEL_STATES.has(state);

  return (
    <li
      data-state={state}
      aria-busy={state === RunNodeState.Running || undefined}
      className={clsx(styles.root, styles[state], className)}
    >
      <NodeTile kind={kind} icon={icon} size={TileSize.Xs} />
      <span className={styles.name}>{name}</span>
      <span className={styles.status}>
        {statusIcon !== null && (
          <Icon name={statusIcon} size={RUN_NODE_STATUS_ICON_SIZE} className={styles.statusIcon} />
        )}
        <span className={labelVisible ? styles.statusLabel : styles.visuallyHidden}>
          {stateLabel}
        </span>
      </span>
    </li>
  );
}
