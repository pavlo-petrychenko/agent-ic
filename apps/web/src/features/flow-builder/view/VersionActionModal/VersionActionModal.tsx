import { AGENT_VERSION_NOTE_MAX_LENGTH } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  VERSION_NOTE_ROWS,
  VersionAction,
} from '@/features/flow-builder/constants/versions.constants';
import type { VersionActionModalProps } from '@/features/flow-builder/view/VersionActionModal/VersionActionModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Field } from '@/shared/ui/inputs/Field';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function VersionActionModal({
  action,
  number,
  liveNumber,
  nextNumber,
  changeCount,
  note,
  blockedReason,
  busy,
  error,
  onNoteChange,
  onConfirm,
  onClose,
}: VersionActionModalProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const rollback = action === VersionAction.Rollback;
  const intro = rollback
    ? nextNumber === null || liveNumber === null
      ? t('versions.rollback.intro', { number })
      : t('versions.rollback.introNext', { number, next: nextNumber, live: liveNumber })
    : liveNumber === null
      ? t('versions.restore.intro', { number })
      : t('versions.restore.introLive', { number, live: liveNumber });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      busy={busy}
      error={error}
      title={t(`versions.${action}.title`, { number })}
      closeLabel={t('versions.close')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={busy} onClick={onClose}>
            {t('versions.cancel')}
          </Button>
          <Button loading={busy} disabled={blockedReason !== null} onClick={onConfirm}>
            {t(`versions.${action}.submit`, { number })}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
          {intro}
        </Text>
        {changeCount !== null && changeCount > 0 && (
          <Callout tone={CalloutTone.Warn}>
            {t('versions.replacesDraft', { count: changeCount })}
          </Callout>
        )}
        {blockedReason !== null && <Callout tone={CalloutTone.Info}>{blockedReason}</Callout>}
        {rollback && (
          <Field label={t('versions.rollback.note')}>
            {(control) => (
              <Textarea
                {...control}
                rows={VERSION_NOTE_ROWS}
                value={note}
                maxLength={AGENT_VERSION_NOTE_MAX_LENGTH}
                onChange={(event) => onNoteChange(event.target.value)}
              />
            )}
          </Field>
        )}
      </div>
    </Dialog>
  );
}
