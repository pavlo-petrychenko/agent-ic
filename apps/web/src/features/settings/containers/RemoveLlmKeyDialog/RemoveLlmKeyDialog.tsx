import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { RemoveLlmKeyDialogProps } from '@/features/settings/containers/RemoveLlmKeyDialog/RemoveLlmKeyDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextElement } from '@/shared/ui/typography/Text';

export function RemoveLlmKeyDialog({
  provider,
  open,
  onOpenChange,
  onConfirm,
}: RemoveLlmKeyDialogProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();

  const confirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('llmKeys.removeDialog.title', { provider })}
      closeLabel={tCommon('ui.close')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} onClick={() => onOpenChange(false)}>
            {t('llmKeys.removeDialog.cancel')}
          </Button>
          <Button variant={ButtonVariant.Danger} onClick={confirm}>
            {t('llmKeys.removeDialog.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text as={TextElement.Paragraph}>{t('llmKeys.removeDialog.warning')}</Text>
        <Callout tone={CalloutTone.Warn}>{t('llmKeys.removeDialog.notice')}</Callout>
      </div>
    </Dialog>
  );
}
