import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { DisconnectTelegramBotDialogProps } from '@/features/channels/view/DisconnectTelegramBotDialog/DisconnectTelegramBotDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text } from '@/shared/ui/typography/Text';

export function DisconnectTelegramBotDialog({
  username,
  agent,
  apiChannelName,
  onOpenChange,
  onCancel,
  onConfirm,
}: DisconnectTelegramBotDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const body =
    apiChannelName === null
      ? t('telegram.bot.disconnectDialog.body')
      : t('telegram.bot.disconnectDialog.bodyWithApi', { agent, channel: apiChannelName });

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={t('telegram.bot.disconnectDialog.title', { username })}
      description={t('telegram.bot.disconnectDialog.description', { agent })}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onCancel}>
            {t('telegram.bot.disconnectDialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} onClick={onConfirm}>
            {t('telegram.bot.disconnectDialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Text>{body}</Text>
        <Callout tone={CalloutTone.Warn}>{t('telegram.bot.disconnectDialog.warning')}</Callout>
      </div>
    </Dialog>
  );
}
