import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import {
  KNOWLEDGE_SCHEDULE_PRESETS,
  KnowledgeScheduleMode,
} from '@/features/knowledge/constants/knowledgeSource.constants';
import type { SourceScheduleFieldProps } from '@/features/knowledge/view/SourceScheduleField/SourceScheduleField.typedefs';
import { Field } from '@/shared/ui/inputs/Field';
import { OptionCard } from '@/shared/ui/inputs/OptionCard';
import { Select } from '@/shared/ui/inputs/Select';
import styles from '@/features/knowledge/view/SourceScheduleField/SourceScheduleField.module.scss';

export function SourceScheduleField({
  schedule,
  disabled = false,
  onChange,
}: SourceScheduleFieldProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const name = useId();
  const scheduled = schedule.mode === KnowledgeScheduleMode.Scheduled;
  const options = KNOWLEDGE_SCHEDULE_PRESETS.map((preset) => ({
    value: preset,
    label: t(`sources.schedule.presets.${preset}`),
  }));

  return (
    <div className={styles.options}>
      <OptionCard
        name={name}
        value={KnowledgeScheduleMode.Manual}
        checked={!scheduled}
        title={t('sources.schedule.manual')}
        description={t('sources.schedule.manualDescription')}
        onSelect={() => onChange({ ...schedule, mode: KnowledgeScheduleMode.Manual })}
      />
      <OptionCard
        name={name}
        value={KnowledgeScheduleMode.Scheduled}
        checked={scheduled}
        title={t('sources.schedule.scheduled')}
        description={t('sources.schedule.scheduledDescription')}
        onSelect={() => onChange({ ...schedule, mode: KnowledgeScheduleMode.Scheduled })}
      >
        {scheduled ? (
          <Field label={t('sources.schedule.label')}>
            {(control) => (
              <Select
                {...control}
                value={schedule.preset}
                options={options}
                disabled={disabled}
                onChange={(event) => {
                  const preset = KNOWLEDGE_SCHEDULE_PRESETS.find(
                    (candidate) => candidate === event.target.value,
                  );
                  if (preset !== undefined) {
                    onChange({ ...schedule, preset });
                  }
                }}
              />
            )}
          </Field>
        ) : null}
      </OptionCard>
    </div>
  );
}
