import clsx from 'clsx';
import { BROWSER_NOTIFICATION_ICON_SIZE } from '@/features/inbox/constants/browserNotification.constants';
import type { NotificationBellButtonProps } from '@/features/inbox/typedefs/notificationList.typedefs';
import { CountBadge } from '@/shared/ui/display/CountBadge';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/NotificationBellButton/NotificationBellButton.module.scss';

export function NotificationBellButton({
  count,
  label,
  className,
  ...rest
}: NotificationBellButtonProps) {
  return (
    <button {...rest} type="button" aria-label={label} className={clsx(styles.root, className)}>
      <Icon name={IconName.Bell} size={BROWSER_NOTIFICATION_ICON_SIZE} />
      {count > 0 && <CountBadge count={count} className={styles.badge} />}
    </button>
  );
}
