import { useTranslation } from 'react-i18next';
import { CHANNELS_NAMESPACE } from '@/features/channels/constants/channelsI18n.constants';
import type { ApiSecretKeyDialogProps } from '@/features/channels/view/ApiSecretKeyDialog/ApiSecretKeyDialog.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { ReadonlyValue } from '@/shared/ui/inputs/ReadonlyValue';
import { Dialog, DialogSize } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function ApiSecretKeyDialog({
  channelName,
  secret,
  endpoint,
  onOpenChange,
  onCopy,
  onDone,
}: ApiSecretKeyDialogProps) {
  const { t } = useTranslation(CHANNELS_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={t('api.secret.title')}
      description={t('api.secret.description', { name: channelName })}
      closeLabel={t('dialog.close')}
      size={DialogSize.Md}
      footerLeft={<Button variant={ButtonVariant.Ghost}>{t('api.secret.docs')}</Button>}
      footerRight={<Button onClick={onDone}>{t('api.secret.done')}</Button>}
    >
      <div className="flex flex-col gap-3">
        <Callout tone={CalloutTone.Warn}>{t('api.secret.copyWarning')}</Callout>
        <div className="flex flex-col gap-1.5">
          <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            {t('api.secret.keyLabel')}
          </Text>
          <div className="flex items-start gap-2">
            <ReadonlyValue mono className="min-w-0 flex-1">
              {secret}
            </ReadonlyValue>
            <Button onClick={onCopy}>{t('api.secret.copy')}</Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Text as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Mute}>
            {t('api.secret.endpointLabel')}
          </Text>
          <ReadonlyValue mono>{endpoint}</ReadonlyValue>
        </div>
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {t('api.secret.rotationHint')}
        </Text>
      </div>
    </Dialog>
  );
}
