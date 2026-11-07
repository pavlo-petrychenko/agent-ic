import { NotificationPreferenceRow } from '@/features/settings/view/NotificationsCard/NotificationPreferenceRow';
import type { NotificationsCardProps } from '@/features/settings/view/NotificationsCard/NotificationsCard.typedefs';
import { Card } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/NotificationsCard/NotificationsCard.module.scss';

export function NotificationsCard({
  title,
  description,
  rows,
  footer,
  children,
}: NotificationsCardProps) {
  return (
    <Card aria-label={title}>
      <div className="flex flex-col gap-0.5">
        <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
          {title}
        </Heading>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {description}
        </Text>
      </div>
      <ul className={styles.preferences}>
        {rows.map((row) => (
          <NotificationPreferenceRow key={row.id} row={row} />
        ))}
      </ul>
      {children}
      <div className={styles.footer}>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {footer}
        </Text>
      </div>
    </Card>
  );
}
