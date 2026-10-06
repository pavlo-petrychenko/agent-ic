import { createLink, type LinkComponent } from '@tanstack/react-router';
import clsx from 'clsx';
import { Badge } from '@/shared/ui/display/Badge/Badge';
import { BadgeTone } from '@/shared/ui/display/Badge/Badge.constants';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { StatusDot } from '@/shared/ui/display/StatusDot/StatusDot';
import { RUN_STATUS_DOT_KINDS } from '@/shared/ui/runs/RunRow/RunRow.constants';
import type { RunRowAnchorProps } from '@/shared/ui/runs/RunRow/RunRow.typedefs';
import styles from '@/shared/ui/runs/RunRow/RunRow.module.scss';

function RunRowAnchor({
  title,
  time,
  dateTime,
  status,
  statusLabel,
  detail,
  triggerIcon = null,
  quality = null,
  selected = false,
  className,
  ...rest
}: RunRowAnchorProps) {
  return (
    <a
      {...rest}
      aria-current={selected ? 'page' : rest['aria-current']}
      className={clsx(styles.root, selected && styles.selected, className)}
    >
      <span className={styles.head}>
        <StatusDot kind={RUN_STATUS_DOT_KINDS[status]} aria-label={statusLabel} />
        <NodeTile kind={NodeKind.Trig} size={TileSize.Xs} icon={triggerIcon} />
        <span className={styles.title}>{title}</span>
        <time dateTime={dateTime} className={styles.time}>
          {time}
        </time>
      </span>
      <span className={styles.detail}>
        {detail.map((part, index) => (
          <span key={index} className={styles.part}>
            {part}
          </span>
        ))}
        {quality !== null && (
          <Badge tone={BadgeTone.Violet} mono className={styles.quality}>
            {quality}
          </Badge>
        )}
      </span>
    </a>
  );
}

const RouterRunRowAnchor = createLink(RunRowAnchor);

export const RunRow: LinkComponent<typeof RunRowAnchor> = (props) => (
  <RouterRunRowAnchor preload="intent" {...props} />
);
