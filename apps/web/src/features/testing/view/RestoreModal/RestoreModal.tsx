import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { RestoreModalProps } from '@/features/testing/view/RestoreModal/RestoreModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function RestoreModal({
  number,
  subtitle,
  liveNumber,
  draftNumber,
  changeCount,
  restoring,
  error,
  onRestore,
  onClose,
}: RestoreModalProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      busy={restoring}
      error={error}
      title={t('versions.restore.title', { number })}
      description={subtitle}
      closeLabel={t('versions.restore.close')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={restoring} onClick={onClose}>
            {t('versions.restore.cancel')}
          </Button>
          <Button loading={restoring} onClick={onRestore}>
            {t('versions.restore.submit', { number })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
          {liveNumber === null
            ? t('versions.restore.intro', { number })
            : t('versions.restore.introLive', { number, live: liveNumber })}
        </Text>
        {changeCount !== null && changeCount > 0 && (
          <Callout tone={CalloutTone.Warn}>
            {t('versions.restore.warning', { count: changeCount, draft: draftNumber })}
          </Callout>
        )}
      </div>
    </Dialog>
  );
}
