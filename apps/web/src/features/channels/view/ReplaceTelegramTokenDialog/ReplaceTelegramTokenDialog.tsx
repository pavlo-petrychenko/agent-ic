import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { ReplaceTelegramTokenDialogProps } from '@/features/channels/view/ReplaceTelegramTokenDialog/ReplaceTelegramTokenDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';

export function ReplaceTelegramTokenDialog({
  username,
  token,
  tokenError,
  busy,
  error,
  onTokenChange,
  onOpenChange,
  onCancel,
  onConfirm,
}: ReplaceTelegramTokenDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={t('telegram.bot.replaceDialog.title', { username })}
      description={t('telegram.bot.replaceDialog.description')}
      closeLabel={t('dialog.close')}
      size={DialogSize.Sm}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={busy} onClick={onCancel}>
            {t('telegram.bot.replaceDialog.cancel')}
          </Button>
          <Button loading={busy} onClick={onConfirm}>
            {t('telegram.bot.replaceDialog.confirm')}
          </Button>
        </>
      }
    >
      <Field
        label={t('telegram.bot.replaceDialog.tokenLabel')}
        hint={t('telegram.bot.replaceDialog.tokenHint')}
        error={tokenError}
      >
        {(control) => (
          <Input
            {...control}
            value={token}
            mono
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onTokenChange(event.target.value)}
          />
        )}
      </Field>
    </Dialog>
  );
}
