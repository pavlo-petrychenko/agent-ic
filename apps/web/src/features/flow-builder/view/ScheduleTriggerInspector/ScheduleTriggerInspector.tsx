import { ChannelType, MAX_SCHEDULE_CONVERSATIONS_PER_RUN, ScheduleKind } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  SCHEDULE_CHANNEL_TYPES,
  SCHEDULE_CRON_PLACEHOLDER,
  SCHEDULE_KINDS,
  SCHEDULE_MIN_CONVERSATIONS,
  SchedulePath,
} from '@/features/flow-builder/constants/schedule.constants';
import { FieldList } from '@/features/flow-builder/view/FieldList';
import type { ScheduleTriggerInspectorProps } from '@/features/flow-builder/view/ScheduleTriggerInspector/ScheduleTriggerInspector.typedefs';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { Field } from '@/shared/ui/inputs/Field';
import { Input } from '@/shared/ui/inputs/Input';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function ScheduleTriggerInspector({
  config,
  nextRuns,
  fields,
  issue,
  onKindChange,
  onTimeChange,
  onCronChange,
  onCommit,
  timeZoneField,
  silenceField,
  onSilentToggle,
  onNotEscalatedChange,
  onChannelChange,
  onMaxChange,
  onOncePerConversationChange,
}: ScheduleTriggerInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { schedule, conditions } = config;
  const message = (found: FlowIssue | null) =>
    found === null ? null : t(`issue.${found.code}`, { ...found.params });
  const scheduleIssue = message(issue(SchedulePath.Schedule));
  const channelsIssue = message(issue(SchedulePath.ChannelTypes));
  const silentIssue = issue(SchedulePath.SilentForHours);
  const maxIssue = message(issue(SchedulePath.MaxConversations));
  const hasTelegram = conditions.channelTypes.includes(ChannelType.Telegram);

  return (
    <>
      <InspectorSection title={t('inspector.schedule.when')}>
        <SegmentedControl
          ariaLabel={t('inspector.schedule.when')}
          value={schedule.kind}
          options={SCHEDULE_KINDS.map((kind) => ({
            value: kind,
            label: t(`inspector.schedule.kind.${kind}`),
          }))}
          onValueChange={onKindChange}
        />
        {schedule.kind === ScheduleKind.Custom ? (
          <Field
            label={t('inspector.schedule.cron')}
            hint={t('inspector.schedule.cronHint')}
            error={message(issue(SchedulePath.Cron))}
          >
            {(control) => (
              <Input
                {...control}
                mono
                value={schedule.cron}
                placeholder={SCHEDULE_CRON_PLACEHOLDER}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => onCronChange(event.target.value)}
                onBlur={onCommit}
              />
            )}
          </Field>
        ) : (
          <Field label={t('inspector.schedule.time')}>
            {(control) => (
              <Input
                {...control}
                type="time"
                value={schedule.time}
                onChange={(event) => {
                  if (event.target.value !== '') {
                    onTimeChange(event.target.value);
                  }
                }}
              />
            )}
          </Field>
        )}
        {timeZoneField}
        {scheduleIssue !== null && (
          <Text kind={TextKind.Caption} color={TextColor.Err} role="alert">
            {scheduleIssue}
          </Text>
        )}
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.schedule.nextRuns')}
        </Text>
        {nextRuns.length === 0 ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('inspector.schedule.nextRunsEmpty')}
          </Text>
        ) : (
          <RowList
            aria-label={t('inspector.schedule.nextRuns')}
            mono={false}
            rows={nextRuns.map((run, index) => ({ id: String(index), name: run }))}
          />
        )}
      </InspectorSection>
      <InspectorSection title={t('inspector.schedule.conversations')}>
        <Switch
          label={t('inspector.schedule.silent')}
          checked={conditions.silentForHours !== null}
          onCheckedChange={onSilentToggle}
        />
        {conditions.silentForHours !== null && silenceField}
        {silentIssue !== null && <Callout tone={CalloutTone.Warn}>{message(silentIssue)}</Callout>}
        <Switch
          label={t('inspector.schedule.notEscalated')}
          checked={conditions.notEscalated}
          onCheckedChange={onNotEscalatedChange}
        />
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.schedule.notEscalatedHint')}
        </Text>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.schedule.channels')}
        </Text>
        <div className="flex flex-wrap gap-3">
          {SCHEDULE_CHANNEL_TYPES.map((type) => (
            <Checkbox
              key={type}
              label={t(`inspector.schedule.channel.${type}`)}
              checked={conditions.channelTypes.includes(type)}
              invalid={channelsIssue !== null}
              onCheckedChange={(on) => onChannelChange(type, on)}
            />
          ))}
        </div>
        {channelsIssue !== null && (
          <Text kind={TextKind.Caption} color={TextColor.Err} role="alert">
            {channelsIssue}
          </Text>
        )}
        {hasTelegram && <Callout>{t('inspector.schedule.telegramNote')}</Callout>}
      </InspectorSection>
      <InspectorSection title={t('inspector.schedule.limits')}>
        <Field
          label={t('inspector.schedule.maxPerRun')}
          hint={t('inspector.schedule.maxPerRunHint', { max: MAX_SCHEDULE_CONVERSATIONS_PER_RUN })}
          error={maxIssue}
        >
          {(control) => (
            <Input
              {...control}
              key={config.maxConversationsPerRun}
              type="number"
              inputMode="numeric"
              min={SCHEDULE_MIN_CONVERSATIONS}
              step={1}
              defaultValue={config.maxConversationsPerRun}
              onBlur={(event) => {
                const next = Number(event.target.value);
                if (
                  Number.isInteger(next) &&
                  next >= SCHEDULE_MIN_CONVERSATIONS &&
                  next !== config.maxConversationsPerRun
                ) {
                  onMaxChange(next);
                } else {
                  event.target.value = String(config.maxConversationsPerRun);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.currentTarget.blur();
                }
              }}
            />
          )}
        </Field>
        <Switch
          label={t('inspector.schedule.oncePerConversation')}
          checked={config.oncePerConversation}
          onCheckedChange={onOncePerConversationChange}
        />
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t(`inspector.schedule.onceHint.${config.oncePerConversation}`)}
        </Text>
      </InspectorSection>
      <FieldList title={t('inspector.trigger.available')} rows={fields} />
    </>
  );
}
