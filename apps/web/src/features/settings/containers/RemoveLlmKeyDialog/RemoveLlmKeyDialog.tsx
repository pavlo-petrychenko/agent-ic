import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRemoveLlmKey } from '@/features/settings/communication/hooks/useRemoveLlmKey';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { RemoveLlmKeyDialogProps } from '@/features/settings/containers/RemoveLlmKeyDialog/RemoveLlmKeyDialog.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';
import { Text, TextElement } from '@/shared/ui/typography/Text';

export function RemoveLlmKeyDialog({
  llmKey,
  provider,
  open,
  onOpenChange,
}: RemoveLlmKeyDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const removeLlmKey = useRemoveLlmKey();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeLlmKey(llmKey.id);
      showToast({ message: t('llmKeys.removed', { provider }), tone: ToastTone.Ok });
      handleOpenChange(false);
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('llmKeys.removeDialog.title', { provider })}
      closeLabel={tCommon('ui.close')}
      busy={busy}
      error={error}
      footerRight={
        <>
          <Button
            variant={ButtonVariant.Secondary}
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            {t('llmKeys.removeDialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} loading={busy} onClick={() => void confirm()}>
            {t('llmKeys.removeDialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text as={TextElement.Paragraph}>{t('llmKeys.removeDialog.warning')}</Text>
        <Callout tone={CalloutTone.Warn}>
          {llmKey.usedBySteps > 0
            ? t('llmKeys.removeDialog.inUse', { count: llmKey.usedBySteps })
            : t('llmKeys.removeDialog.notice')}
        </Callout>
      </div>
    </Dialog>
  );
}
