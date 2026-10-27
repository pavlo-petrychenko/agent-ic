import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { DeleteApiChannelDialogProps } from '@/features/channels/view/DeleteApiChannelDialog/DeleteApiChannelDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function DeleteApiChannelDialog({
  channelName,
  agentName,
  typedName,
  confirmed,
  onTypedNameChange,
  onSubmit,
  onClose,
}: DeleteApiChannelDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const inputId = useId();
  const promptId = `${inputId}-prompt`;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('api.channel.deleteDialog.title', { name: channelName })}
      description={t('api.channel.deleteDialog.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            {t('api.channel.deleteDialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} disabled={!confirmed} onClick={onSubmit}>
            {t('api.channel.deleteDialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text>{t('api.channel.deleteDialog.body', { agent: agentName })}</Text>
        <div className="flex flex-col gap-1.5">
          <Text id={promptId} as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            <Trans
              t={t}
              i18nKey="api.channel.deleteDialog.confirmLabel"
              values={{ name: channelName }}
              components={{ strong: <strong /> }}
            />
          </Text>
          <label htmlFor={inputId} className="sr-only">
            {t('api.channel.deleteDialog.confirmInputLabel')}
          </label>
          <Input
            id={inputId}
            aria-describedby={promptId}
            autoComplete="off"
            value={typedName}
            placeholder={t('api.channel.deleteDialog.confirmPlaceholder', { name: channelName })}
            onChange={(event) => onTypedNameChange(event.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
