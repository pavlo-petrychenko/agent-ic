import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { INBOX_NAMESPACE } from '@/features/inbox/constants/inboxI18n.constants';
import type { NotificationListProps } from '@/features/inbox/typedefs/notificationList.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/inbox/view/NotificationList/NotificationList.module.scss';

export function NotificationList({
  rows,
  loading,
  markingAll,
  markAllDisabled,
  onOpen,
  onMarkAll,
}: NotificationListProps) {
  const { t } = useTranslation(INBOX_NAMESPACE);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.title}>{t('notifications.title')}</span>
        <Button
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          onClick={onMarkAll}
          disabled={markingAll || markAllDisabled}
        >
          {t('notifications.markAllRead')}
        </Button>
      </div>
      {loading ? (
        <div className={styles.loading}>
          <Skeleton label={t('notifications.loading')} />
          <Skeleton label={t('notifications.loading')} />
          <Skeleton label={t('notifications.loading')} />
        </div>
      ) : rows.length === 0 ? (
        <Text kind={TextKind.Caption} color={TextColor.Mute} className={styles.empty}>
          {t('notifications.empty')}
        </Text>
      ) : (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className={clsx(styles.row, row.read && styles.read)}
                onClick={() => onOpen(row)}
              >
                <span
                  aria-label={row.read ? undefined : t('notifications.unread')}
                  className={clsx(styles.dot, row.read && styles.dotRead)}
                />
                <span className={styles.text}>
                  <span className={styles.rowTitle}>{row.title}</span>
                  <span className={styles.rowSubtitle}>{row.subtitle}</span>
                  <span className={styles.meta}>{row.meta}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
