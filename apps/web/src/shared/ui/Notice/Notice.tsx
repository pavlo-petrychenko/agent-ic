import clsx from 'clsx';
import { useId } from 'react';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { NodeTile } from '@/shared/ui/NodeTile/NodeTile';
import { NodeKind, TileSize } from '@/shared/ui/NodeTile/NodeTile.constants';
import type { NoticeProps } from '@/shared/ui/Notice/Notice.typedefs';
import styles from '@/shared/ui/Notice/Notice.module.scss';

export function Notice({
  icon,
  title,
  tone = NodeKind.Neutral,
  meta = null,
  action = null,
  className,
  ...rest
}: NoticeProps) {
  const titleId = useId();

  return (
    <li {...rest} className={clsx(styles.root, className)}>
      <NodeTile kind={tone} size={TileSize.Md} icon={icon} />
      <div className={styles.stack}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        {meta !== null && <span className={styles.meta}>{meta}</span>}
        {action !== null &&
          (action.href !== undefined && action.href !== null ? (
            <Button
              variant={ButtonVariant.Ghost}
              href={action.href}
              aria-describedby={titleId}
              className={styles.action}
            >
              {action.label}
            </Button>
          ) : (
            <Button
              variant={ButtonVariant.Ghost}
              type="button"
              onClick={action.onClick ?? undefined}
              aria-describedby={titleId}
              className={styles.action}
            >
              {action.label}
            </Button>
          ))}
      </div>
    </li>
  );
}
