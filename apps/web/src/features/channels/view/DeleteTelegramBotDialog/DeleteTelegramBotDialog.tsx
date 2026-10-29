import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { DeleteTelegramBotDialogProps } from '@/features/channels/view/DeleteTelegramBotDialog/DeleteTelegramBotDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function DeleteTelegramBotDialog({
  channelName,
  typedName,
  confirmed,
  busy,
  error,
  onTypedNameChange,
  onOpenChange,
  onCancel,
  onSubmit,
}: DeleteTelegramBotDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);
  const inputId = useId();
  const promptId = `${inputId}-prompt`;

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={t('telegram.bot.deleteDialog.title', { username: channelName })}
      description={t('telegram.bot.deleteDialog.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={busy} onClick={onCancel}>
            {t('telegram.bot.deleteDialog.cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Danger}
            loading={busy}
            disabled={!confirmed}
            onClick={onSubmit}
          >
            {t('telegram.bot.deleteDialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text>{t('telegram.bot.deleteDialog.body')}</Text>
        <div className="flex flex-col gap-1.5">
          <Text id={promptId} as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            <Trans
              t={t}
              i18nKey="telegram.bot.deleteDialog.confirmLabel"
              values={{ name: channelName }}
              components={{ strong: <strong /> }}
            />
          </Text>
          <label htmlFor={inputId} className="sr-only">
            {t('telegram.bot.deleteDialog.confirmInputLabel')}
          </label>
          <Input
            id={inputId}
            aria-describedby={promptId}
            autoComplete="off"
            value={typedName}
            placeholder={t('telegram.bot.deleteDialog.confirmPlaceholder', { name: channelName })}
            onChange={(event) => onTypedNameChange(event.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
