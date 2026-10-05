import type { AuthPanelProps } from '@/features/auth/view/AuthPanel/AuthPanel.typedefs';
import { Card, CardElement, CardGap, CardPad } from '@/shared/ui/display/Card';
import { Divider } from '@/shared/ui/layout/Divider';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/auth/view/AuthPanel/AuthPanel.module.scss';

export function AuthPanel({
  title = null,
  subtitle = null,
  footer = null,
  children,
}: AuthPanelProps) {
  return (
    <Card as={CardElement.Section} pad={CardPad.Xl} gap={CardGap.Xl}>
      {title !== null && (
        <div className={styles.header}>
          <Heading size={HeadingSize.H2} as={HeadingElement.H1}>
            {title}
          </Heading>
          {subtitle !== null && (
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {subtitle}
            </Text>
          )}
        </div>
      )}
      {children}
      {footer !== null && (
        <>
          <Divider decorative={false} />
          <div className={styles.footer}>{footer}</div>
        </>
      )}
    </Card>
  );
}
