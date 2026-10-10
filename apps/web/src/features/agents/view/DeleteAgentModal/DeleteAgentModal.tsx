import { Trans, useTranslation } from 'react-i18next';
import { AGENTS_NAMESPACE } from '@/features/agents/constants/agentsI18n.constants';
import type { DeleteAgentModalProps } from '@/features/agents/view/DeleteAgentModal/DeleteAgentModal.typedefs';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { KeyValue, KeyValueLayout } from '@/shared/ui/display/KeyValue';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Dialog } from '@/shared/ui/overlays/Dialog';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

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
          items={[
            {
              label: t('delete.versions', { count: versionCount }),
              value: t('delete.versionsValue'),
            },
            { label: t('delete.conversations'), value: t('delete.conversationsValue') },
          ]}
        />
        <Text kind={TextKind.BodySmall} color={TextColor.Ink2}>
          <Trans
            t={t}
            i18nKey="delete.confirm"
            values={{ name: agentName }}
            components={{ strong: <strong /> }}
          />
        </Text>
        <Field label={t('delete.nameLabel')}>
          {(control) => (
            <Input
              id={control.id}
              aria-describedby={control['aria-describedby']}
              autoComplete="off"
              value={typedName}
              onChange={(event) => onTypedNameChange(event.target.value)}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
