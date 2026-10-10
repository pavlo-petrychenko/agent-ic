import { AGENT_AWAY_MESSAGE_MAX_LENGTH } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import {
  AWAY_MESSAGE_ROWS,
  PAUSE_MODE_FIELD_NAME,
  PAUSE_MODE_LABEL_KEYS,
  PAUSE_MODES,
} from '@/features/agents/constants/agentPause.constants';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { PauseAgentModalProps } from '@/features/agents/view/PauseAgentModal/PauseAgentModal.typedefs';
import { PauseMode } from '@/shared/api/generated/schema.generated';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Radio, RadioOrientation } from '@/shared/ui/inputs/Radio';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function PauseAgentModal({
  agentName,
  statusLabel,
  liveVersionNumber,
  mode,
  awayMessage,
  awayMessageError,
  submitting,
  error,
  onModeChange,
  onAwayMessageChange,
  onSubmit,
  onClose,
}: PauseAgentModalProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      busy={submitting}
      error={error}
      title={t('pause.title', { name: agentName })}
      description={statusLabel}
      closeLabel={t('dialog.close')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button loading={submitting} onClick={onSubmit}>
            {t('pause.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
          {t('pause.intro')}
        </Text>
        <div className="flex flex-col gap-2">
          <Text kind={TextKind.Small} color={TextColor.Mute}>
            {t('pause.modeLabel')}
          </Text>
          <Radio
            name={PAUSE_MODE_FIELD_NAME}
            ariaLabel={t('pause.modeLabel')}
            orientation={RadioOrientation.Vertical}
            value={mode}
            options={PAUSE_MODES.map((value) => ({
              value,
              label: t(PAUSE_MODE_LABEL_KEYS[value]),
            }))}
            onValueChange={(value) => {
              const next = PAUSE_MODES.find((entry) => entry === value);
              if (next !== undefined) {
                onModeChange(next);
              }
            }}
          />
        </div>
        {mode === PauseMode.AwayMessage && (
          <Field
            label={t('pause.awayLabel')}
            hint={t('pause.awayHint', { max: AGENT_AWAY_MESSAGE_MAX_LENGTH })}
            error={awayMessageError}
          >
            {(control) => (
              <Textarea
                id={control.id}
                aria-describedby={control['aria-describedby']}
                invalid={control.invalid}
                rows={AWAY_MESSAGE_ROWS}
                value={awayMessage}
                onChange={(event) => onAwayMessageChange(event.target.value)}
              />
            )}
          </Field>
        )}
        <Text kind={TextKind.Small} color={TextColor.Mute}>
          {t('pause.resumeNote', { version: liveVersionNumber ?? '' })}
        </Text>
      </div>
    </Dialog>
  );
}
