import { useId } from 'react';
import { BROWSER_NOTIFICATION_ICON_SIZE } from '@/features/inbox/constants/browserNotification.constants';
import type { InboxNotificationCardProps } from '@/features/inbox/view/InboxNotificationCard/InboxNotificationCard.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/inbox/view/InboxNotificationCard/InboxNotificationCard.module.scss';

export function InboxNotificationCard({
  title,
  subtitle,
  openLabel,
  onOpen,
}: InboxNotificationCardProps) {
  const titleId = useId();

  return (
    <output className={styles.root} aria-live="polite">
      <span className={styles.icon}>
        <Icon name={IconName.User} size={BROWSER_NOTIFICATION_ICON_SIZE} />
      </span>
      <span className={styles.text}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        <span className={styles.subtitle}>{subtitle}</span>
      </span>
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        className={styles.action}
        aria-describedby={titleId}
        onClick={onOpen}
      >
        {openLabel}
      </Button>
    </output>
  );
}
