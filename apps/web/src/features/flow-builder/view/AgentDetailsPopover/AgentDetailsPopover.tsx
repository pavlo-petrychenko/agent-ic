import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { AGENT_DESCRIPTION_ROWS } from '@/features/flow-builder/view/AgentDetailsPopover/AgentDetailsPopover.constants';
import type { AgentDetailsPopoverProps } from '@/features/flow-builder/view/AgentDetailsPopover/AgentDetailsPopover.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Textarea } from '@/shared/ui/inputs/Textarea';
import { Popover } from '@/shared/ui/overlays/Popover';
import styles from '@/features/flow-builder/view/AgentDetailsPopover/AgentDetailsPopover.module.scss';

export function AgentDetailsPopover({
  details,
  open,
  saving,
  onOpenChange,
  onSave,
}: AgentDetailsPopoverProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const [name, setName] = useState(details.name);
  const [description, setDescription] = useState(details.description ?? '');

  const changeOpen = (next: boolean) => {
    if (next) {
      setName(details.name);
      setDescription(details.description ?? '');
    }
    onOpenChange(next);
  };

  return (
    <Popover
      open={open}
      onOpenChange={changeOpen}
      ariaLabel={t('details.title')}
      trigger={
        <button
          type="button"
          title={t('details.edit')}
          aria-current="page"
          className={styles.trigger}
        >
          {details.name}
        </button>
      }
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ name, description });
        }}
      >
        <Field label={t('details.name')} required>
          {(control) => (
            <Input
              id={control.id}
              aria-describedby={control['aria-describedby']}
              required={control.required}
              maxLength={AGENT_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          )}
        </Field>
        <Field
          label={t('details.description')}
          hint={t('details.descriptionHint', { max: AGENT_DESCRIPTION_MAX_LENGTH })}
        >
          {(control) => (
            <Textarea
              id={control.id}
              aria-describedby={control['aria-describedby']}
              maxLength={AGENT_DESCRIPTION_MAX_LENGTH}
              rows={AGENT_DESCRIPTION_ROWS}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          )}
        </Field>
        <div className={styles.actions}>
          <Button
            type="button"
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            onClick={() => changeOpen(false)}
          >
            {t('details.cancel')}
          </Button>
          <Button type="submit" size={ButtonSize.Sm} loading={saving} disabled={name.trim() === ''}>
            {t('details.save')}
          </Button>
        </div>
      </form>
    </Popover>
  );
}
