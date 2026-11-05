import { InactivityRepeatKind } from '@agent-ic/flow';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  INACTIVITY_ACTIVITIES,
  INACTIVITY_CHANNEL_TYPES,
  INACTIVITY_REPEAT_KINDS,
  INACTIVITY_REPEAT_TIMES,
} from '@/features/flow-builder/constants/inactivity.constants';
import { FieldList } from '@/features/flow-builder/view/FieldList';
import type { InactivityTriggerInspectorProps } from '@/features/flow-builder/view/InactivityTriggerInspector/InactivityTriggerInspector.typedefs';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { Field } from '@/shared/ui/inputs/Field';
import { Radio, RadioOrientation } from '@/shared/ui/inputs/Radio';
import { Select } from '@/shared/ui/inputs/Select';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function InactivityTriggerInspector({
  config,
  silenceField,
  repeatEveryField,
  autoCloseIssue,
  fields,
  onActivityChange,
  onRepeatKindChange,
  onRepeatTimesChange,
  onNotEscalatedChange,
  onChannelChange,
}: InactivityTriggerInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const activityName = useId();
  const repeatName = useId();
  const { activity, repeat, conditions } = config;

  return (
    <>
      <InspectorSection title={t('inspector.inactivity.silence')}>
        {silenceField}
        {autoCloseIssue !== null && (
          <Callout tone={CalloutTone.Warn}>
            {t(`issue.${autoCloseIssue.code}`, { ...autoCloseIssue.params })}
          </Callout>
        )}
      </InspectorSection>
      <InspectorSection title={t('inspector.inactivity.activity')}>
        <Radio
          name={activityName}
          ariaLabel={t('inspector.inactivity.activity')}
          orientation={RadioOrientation.Vertical}
          value={activity}
          options={INACTIVITY_ACTIVITIES.map((value) => ({
            value,
            label: t(`inspector.inactivity.activityKind.${value}`),
          }))}
          onValueChange={(value) => {
            const next = INACTIVITY_ACTIVITIES.find((candidate) => candidate === value);
            if (next !== undefined) {
              onActivityChange(next);
            }
          }}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.inactivity.conditions')}>
        <Switch
          label={t('inspector.inactivity.notEscalated')}
          checked={conditions.notEscalated}
          onCheckedChange={onNotEscalatedChange}
        />
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.inactivity.channels')}
        </Text>
        <div className="flex flex-wrap gap-3">
          {INACTIVITY_CHANNEL_TYPES.map((type) => {
            const checked = conditions.channelTypes.includes(type);
            const last = INACTIVITY_CHANNEL_TYPES.every(
              (other) => other === type || !conditions.channelTypes.includes(other),
            );
            return (
              <Checkbox
                key={type}
                label={t(`inspector.inactivity.channel.${type}`)}
                checked={checked}
                disabled={checked && last}
                onCheckedChange={(on) => onChannelChange(type, on)}
              />
            );
          })}
        </div>
      </InspectorSection>
      <InspectorSection title={t('inspector.inactivity.repeat')}>
        <Radio
          name={repeatName}
          ariaLabel={t('inspector.inactivity.repeat')}
          orientation={RadioOrientation.Vertical}
          value={repeat.kind}
          options={INACTIVITY_REPEAT_KINDS.map((value) => ({
            value,
            label: t(`inspector.inactivity.repeatKind.${value}`),
          }))}
          onValueChange={(value) => {
            const next = INACTIVITY_REPEAT_KINDS.find((candidate) => candidate === value);
            if (next !== undefined) {
              onRepeatKindChange(next);
            }
          }}
        />
        {repeat.kind === InactivityRepeatKind.Every && (
          <>
            {repeatEveryField}
            <Field label={t('inspector.inactivity.times')}>
              {(control) => (
                <Select
                  {...control}
                  value={String(repeat.maxTimes)}
                  options={INACTIVITY_REPEAT_TIMES.map((count) => ({
                    value: String(count),
                    label: t('inspector.inactivity.timesOption', { count }),
                  }))}
                  onChange={(event) => onRepeatTimesChange(Number(event.target.value))}
                />
              )}
            </Field>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('inspector.inactivity.attemptHint')}
            </Text>
          </>
        )}
      </InspectorSection>
      <Callout>{t('inspector.inactivity.compare')}</Callout>
      <FieldList title={t('inspector.trigger.available')} rows={fields} />
    </>
  );
}
