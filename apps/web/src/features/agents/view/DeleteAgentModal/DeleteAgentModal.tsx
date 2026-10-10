import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import { DELETE_SUMMARY_LABEL_WIDTH } from '@/features/agents/view/DeleteAgentModal/DeleteAgentModal.constants';
import type { DeleteAgentModalProps } from '@/features/agents/view/DeleteAgentModal/DeleteAgentModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextElement, TextKind } from '@/shared/ui/typography/Text';

export function DeleteAgentModal({
  agentName,
  versionCount,
  typedName,
  confirmed,
  submitting,
  error,
  onTypedNameChange,
  onSubmit,
  onClose,
}: DeleteAgentModalProps) {
  const { t } = useTranslation(AGENTS_NAMESPACE);
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
      busy={submitting}
      error={error}
      title={t('delete.title', { name: agentName })}
      description={t('delete.subtitle')}
      closeLabel={t('dialog.close')}
      footerRight={
        <>
          <Button variant={ButtonVariant.Secondary} disabled={submitting} onClick={onClose}>
            {t('dialog.cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Danger}
            disabled={!confirmed}
            loading={submitting}
            onClick={onSubmit}
          >
            {t('delete.submit')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <KeyValue
          layout={KeyValueLayout.Props}
          labelWidth={DELETE_SUMMARY_LABEL_WIDTH}
          items={[
            {
              label: t('delete.versions', { count: versionCount }),
              value: null,
              trailing: <Badge tone={BadgeTone.Err}>{t('delete.versionsValue')}</Badge>,
            },
            {
              label: t('delete.conversations'),
              value: null,
              trailing: <Badge tone={BadgeTone.Neutral}>{t('delete.conversationsValue')}</Badge>,
            },
          ]}
        />
        <div className="flex flex-col gap-1.5">
          <Text id={promptId} as={TextElement.Span} kind={TextKind.Caption} color={TextColor.Ink2}>
            <Trans
              t={t}
              i18nKey="delete.confirm"
              values={{ name: agentName }}
              components={{ strong: <strong /> }}
            />
          </Text>
          <label htmlFor={inputId} className="sr-only">
            {t('delete.nameLabel')}
          </label>
          <Input
            id={inputId}
            aria-describedby={promptId}
            autoComplete="off"
            value={typedName}
            onChange={(event) => onTypedNameChange(event.target.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
