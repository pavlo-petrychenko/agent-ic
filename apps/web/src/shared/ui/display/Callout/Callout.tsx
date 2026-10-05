import clsx from 'clsx';
import {
  CALLOUT_DEFAULT_ICONS,
  CALLOUT_ICON_SIZE,
  CALLOUT_ROLES,
  CalloutTone,
} from '@/shared/ui/display/Callout/Callout.constants';
import type { CalloutProps } from '@/shared/ui/display/Callout/Callout.typedefs';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import styles from '@/shared/ui/display/Callout/Callout.module.scss';

export function Callout({
  tone = CalloutTone.Neutral,
  icon = CALLOUT_DEFAULT_ICONS[tone],
  action = null,
  role = CALLOUT_ROLES[tone],
  className,
  children,
  ...rest
}: CalloutProps) {
  return (
    <div
      {...rest}
      role={role}
      className={clsx(styles.root, styles[tone], action !== null && styles.withAction, className)}
    >
      {icon !== null && <Icon name={icon} size={CALLOUT_ICON_SIZE} className={styles.icon} />}
      <div className={styles.message}>{children}</div>
      {action !== null && <div className={styles.action}>{action}</div>}
    </div>
  );
}
