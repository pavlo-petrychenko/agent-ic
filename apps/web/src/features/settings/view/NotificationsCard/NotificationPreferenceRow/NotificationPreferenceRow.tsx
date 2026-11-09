import type { NotificationPreferenceRowProps } from '@/features/settings/view/NotificationsCard/NotificationPreferenceRow/NotificationPreferenceRow.typedefs';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/NotificationsCard/NotificationPreferenceRow/NotificationPreferenceRow.module.scss';

export function NotificationPreferenceRow({ row }: NotificationPreferenceRowProps) {
  return (
    <li className={styles.row}>
      <div className={styles.text}>
        <Text as={TextElement.Span}>{row.title}</Text>
        <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
          {row.description}
        </Text>
      </div>
      <div className={styles.actions}>{row.action}</div>
    </li>
  );
}
