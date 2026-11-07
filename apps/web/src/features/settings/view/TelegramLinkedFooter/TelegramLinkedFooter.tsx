import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { TelegramLinkedFooterProps } from '@/features/settings/view/TelegramLinkedFooter/TelegramLinkedFooter.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/view/TelegramLinkedFooter/TelegramLinkedFooter.module.scss';

export function TelegramLinkedFooter({ linkedOn, onUnlink }: TelegramLinkedFooterProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  return (
    <div className={styles.telegramFooter}>
      <Button variant={ButtonVariant.Secondary} onClick={onUnlink}>
        {t('notifications.card.unlinkTelegram')}
      </Button>
      {linkedOn === null ? null : (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('notifications.card.linkedOn', { date: linkedOn })}
        </Text>
      )}
    </div>
  );
}
