import {
  FlowIssueCode,
  InactivityRepeatKind,
  durationMinutes,
  triggerVariables,
} from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  INACTIVITY_DURATION_BASE,
  InactivityPath,
} from '@/features/flow-builder/constants/inactivity.constants';
import { PATH_JOINER } from '@/features/flow-builder/constants/inspector.constants';
import type { InactivityTriggerPanelProps } from '@/features/flow-builder/containers/InactivityTriggerPanel/InactivityTriggerPanel.typedefs';
import {
  updateInactivity,
  withActivity,
  withChannelType,
  withNotEscalated,
  withRepeatEvery,
  withRepeatKind,
  withRepeatTimes,
  withSilence,
} from '@/features/flow-builder/logic/helpers/inactivity.helpers';
import { fieldRows } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import { useFlowIssues } from '@/features/flow-builder/logic/hooks/useFlowIssues';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import type { InactivityConfig } from '@/features/flow-builder/typedefs/inactivity.typedefs';
import { InactivityTriggerInspector } from '@/features/flow-builder/view/InactivityTriggerInspector';
import { DurationField } from '@/shared/forms/fields/DurationField';

export function InactivityTriggerPanel({ node }: InactivityTriggerPanelProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const document = useFlowBuilderStore((state) => state.document);
  const apply = useFlowBuilderStore((state) => state.apply);
  const issues = useFlowIssues();
  const { config } = node;
  const { silence, repeat } = config;
  const message = (found: FlowIssue | undefined) =>
    found === undefined ? null : t(`issue.${found.code}`, { ...found.params });
  const issueOf = (code: FlowIssueCode, path: string | null = null) =>
    issues.find(
      (issue) =>
        issue.nodeId === node.id &&
        issue.code === code &&
        (path === null || issue.path.join(PATH_JOINER) === path),
    );
  const autoCloseIssue = issueOf(FlowIssueCode.InactivityAfterAutoClose) ?? null;

  const edit = (change: (current: InactivityConfig) => InactivityConfig) =>
    apply(updateInactivity(document, node.id, change));

  return (
    <InactivityTriggerInspector
      key={node.id}
      config={config}
      silenceField={
        <DurationField
          label={t('inspector.inactivity.silenceLength')}
          value={durationMinutes(silence)}
          base={INACTIVITY_DURATION_BASE}
          error={message(
            issueOf(FlowIssueCode.InactivityDurationOutOfRange, InactivityPath.Silence),
          )}
          onChange={(minutes) => edit((current) => withSilence(current, minutes))}
        />
      }
      repeatEveryField={
        repeat.kind === InactivityRepeatKind.Every ? (
          <DurationField
            label={t('inspector.inactivity.repeatEvery')}
            value={durationMinutes(repeat.every)}
            base={INACTIVITY_DURATION_BASE}
            error={message(
              issueOf(FlowIssueCode.InactivityDurationOutOfRange, InactivityPath.RepeatEvery),
            )}
            onChange={(minutes) => edit((current) => withRepeatEvery(current, minutes))}
          />
        ) : null
      }
      autoCloseIssue={autoCloseIssue}
      fields={fieldRows(triggerVariables(node).map((field) => ({ ...field, values: null })))}
      onActivityChange={(activity) => edit((current) => withActivity(current, activity))}
      onRepeatKindChange={(kind) => edit((current) => withRepeatKind(current, kind))}
      onRepeatTimesChange={(times) => edit((current) => withRepeatTimes(current, times))}
      onNotEscalatedChange={(on) => edit((current) => withNotEscalated(current, on))}
      onChannelChange={(type, on) => edit((current) => withChannelType(current, type, on))}
    />
  );
}
