import { triggerVariables } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  SCHEDULE_DEFAULT_SILENT_HOURS,
  SCHEDULE_SILENCE_UNITS,
  SchedulePath,
} from '@/features/flow-builder/constants/schedule.constants';
import type { ScheduleTriggerPanelProps } from '@/features/flow-builder/containers/ScheduleTriggerPanel/ScheduleTriggerPanel.typedefs';
import { fieldErrors, fieldRows } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import {
  nextRuns,
  updateSchedule,
  withChannelType,
  withScheduleCron,
  withScheduleKind,
  withScheduleTime,
  withScheduleTimeZone,
  withSilentFor,
} from '@/features/flow-builder/logic/helpers/schedule.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { ScheduleConfig } from '@/features/flow-builder/typedefs/schedule.typedefs';
import { ScheduleTriggerInspector } from '@/features/flow-builder/view/ScheduleTriggerInspector';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';
import { DurationField } from '@/shared/forms/fields/DurationField';
import { TimeZoneField } from '@/shared/forms/fields/TimeZoneField';
import { useLocale } from '@/shared/i18n/hooks/useLocale';

export function ScheduleTriggerPanel({ node }: ScheduleTriggerPanelProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const { locale } = useLocale();
  const document = useFlowBuilderStore((state) => state.document);
  const apply = useFlowBuilderStore((state) => state.apply);
  const previewEdit = useFlowBuilderStore((state) => state.previewEdit);
  const issues = useFlowIssues();
  const errors = fieldErrors(issues, node.id);
  const { config } = node;
  const { schedule, conditions } = config;
  const [now] = useState(() => new Date());
  const runs = useMemo(() => nextRuns(schedule, now, locale), [schedule, now, locale]);
  const message = (found: FlowIssue | null) =>
    found === null ? null : t(`issue.${found.code}`, { ...found.params });

  const edit = (change: (current: ScheduleConfig) => ScheduleConfig) =>
    apply(updateSchedule(document, node.id, change));

  return (
    <ScheduleTriggerInspector
      key={node.id}
      config={config}
      nextRuns={runs}
      fields={fieldRows(triggerVariables(node).map((field) => ({ ...field, values: null })))}
      issue={(path) => errors.get(path) ?? null}
      timeZoneField={
        <TimeZoneField
          label={t('inspector.schedule.timeZone')}
          value={schedule.timeZone}
          error={message(errors.get(SchedulePath.TimeZone) ?? null)}
          onChange={(timeZone) =>
            edit((current) => ({
              ...current,
              schedule: withScheduleTimeZone(current.schedule, timeZone),
            }))
          }
        />
      }
      silenceField={
        <DurationField
          label={t('inspector.schedule.silentFor')}
          value={conditions.silentForHours ?? SCHEDULE_DEFAULT_SILENT_HOURS}
          base={DurationUnit.Hour}
          units={SCHEDULE_SILENCE_UNITS}
          onChange={(hours) =>
            edit((current) => ({
              ...current,
              conditions: { ...current.conditions, silentForHours: hours },
            }))
          }
        />
      }
      onKindChange={(kind) =>
        edit((current) => ({ ...current, schedule: withScheduleKind(current.schedule, kind) }))
      }
      onTimeChange={(time) =>
        edit((current) => ({ ...current, schedule: withScheduleTime(current.schedule, time) }))
      }
      onCronChange={(cron) =>
        previewEdit(
          updateSchedule(document, node.id, (current) => ({
            ...current,
            schedule: withScheduleCron(current.schedule, cron),
          })),
        )
      }
      onCommit={() => apply(useFlowBuilderStore.getState().document)}
      onSilentToggle={(on) => edit((current) => withSilentFor(current, on))}
      onNotEscalatedChange={(notEscalated) =>
        edit((current) => ({ ...current, conditions: { ...current.conditions, notEscalated } }))
      }
      onChannelChange={(type, on) => edit((current) => withChannelType(current, type, on))}
      onMaxChange={(maxConversationsPerRun) =>
        edit((current) => ({ ...current, maxConversationsPerRun }))
      }
      onOncePerConversationChange={(oncePerConversation) =>
        edit((current) => ({ ...current, oncePerConversation }))
      }
    />
  );
}
