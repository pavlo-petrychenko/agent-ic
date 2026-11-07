import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { TelegramPreferenceActionProps } from '@/features/settings/view/TelegramPreferenceAction/TelegramPreferenceAction.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Switch } from '@/shared/ui/inputs/Switch';

export function TelegramPreferenceAction({
  linked,
  enabled,
  waiting,
  creating,
  disabled,
  onStart,
  onToggle,
}: TelegramPreferenceActionProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  if (waiting) {
    return (
      <Badge tone={BadgeTone.Warn} dot>
        {t('notifications.card.waitingForCode')}
      </Badge>
    );
  }

  if (linked) {
    return (
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={t('notifications.card.telegram')}
      />
    );
  }

  return (
    <Button variant={ButtonVariant.Secondary} loading={creating} onClick={onStart}>
      {t('notifications.link.action')}
    </Button>
  );
}
