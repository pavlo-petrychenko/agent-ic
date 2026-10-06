import clsx from 'clsx';
import {
  EMPTY_STATE_ICON_SIZE,
  EmptyStateTone,
} from '@/shared/ui/display/EmptyState/EmptyState.constants';
import type { EmptyStateProps } from '@/shared/ui/display/EmptyState/EmptyState.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/display/EmptyState/EmptyState.module.scss';

export function EmptyState({
  icon,
  title,
  description = null,
  tone = EmptyStateTone.Neutral,
  actions = null,
}: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <span className={clsx(styles.icon, styles[tone])}>
        <Icon name={icon} size={EMPTY_STATE_ICON_SIZE} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {description !== null && <p className={styles.description}>{description}</p>}
      {actions !== null && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
