import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { TelegramLinkCardProps } from '@/features/settings/view/TelegramLinkCard/TelegramLinkCard.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Card, CardPad, CardTone } from '@/shared/ui/display/Card';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/TelegramLinkCard/TelegramLinkCard.module.scss';

export function TelegramLinkCard({
  code,
  formattedCode,
  botUsername,
  minutesLeft,
  onCopy,
}: TelegramLinkCardProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <Card tone={CardTone.Panel} pad={CardPad.Lg} aria-label={t('notifications.link.title')}>
      <Heading size={HeadingSize.H3} as={HeadingElement.H4}>
        {t('notifications.link.title')}
      </Heading>
      <ul className={styles.linkSteps}>
        <li>{t('notifications.link.openBot', { bot: `@${botUsername}` })}</li>
        <li>{t('notifications.link.sendCode', { minutes: minutesLeft })}</li>
      </ul>
      <div className={styles.codeRow}>
        <code className={styles.code}>{formattedCode}</code>
        <div className={styles.codeActions}>
          <Button variant={ButtonVariant.Secondary} onClick={onCopy}>
            {t('notifications.link.copy')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            href={`https://t.me/${botUsername}?start=${code}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('notifications.link.open')}
          </Button>
        </div>
      </div>
      <Text kind={TextKind.Caption} color={TextColor.Mute}>
        {t('notifications.link.hint')}
      </Text>
    </Card>
  );
}
