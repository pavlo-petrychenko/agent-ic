import { EscalationMode } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { ESCALATION_MODES } from '@/features/flow-builder/constants/escalation.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type { EscalationInspectorProps } from '@/features/flow-builder/view/EscalationInspector/EscalationInspector.typedefs';
import { HandoffNotifyFields } from '@/features/flow-builder/view/HandoffNotifyFields';
import { HandoffWaitFields } from '@/features/flow-builder/view/HandoffWaitFields';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { InspectorSection } from '@/shared/ui/layout/Inspector';

export function EscalationInspector({
  config,
  variables,
  recipients,
  counts,
  issue,
  onModeChange,
  onMessageChange,
  onTemplateChange,
  onCommit,
  onRecipientsChange,
  onChannelChange,
}: EscalationInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  return (
    <>
      <InspectorSection title={t('inspector.escalation.what')}>
        <SegmentedControl
          ariaLabel={t('inspector.escalation.what')}
          value={config.mode}
          options={ESCALATION_MODES.map((mode) => ({
            value: mode,
            label: t(`inspector.escalation.mode.${mode}`),
          }))}
          onValueChange={onModeChange}
        />
      </InspectorSection>
      <InspectorSection title={t('inspector.escalation.message')}>
        <TemplateField
          label={t('inspector.escalation.message')}
          value={config.customerMessage ?? ''}
          variables={variables}
          hint={t(`inspector.escalation.messageHint.${config.mode}`)}
          issue={issue(IssuePathSegment.CustomerMessage)}
          placeholder={null}
          onChange={onMessageChange}
          onCommit={onCommit}
        />
      </InspectorSection>
      {config.mode === EscalationMode.Escalate && (
        <>
          <InspectorSection title={t('inspector.escalation.notify')}>
            <HandoffNotifyFields
              channels={config.notify.channels}
              recipients={recipients}
              counts={counts}
              onRecipientsChange={onRecipientsChange}
              onChannelChange={onChannelChange}
            />
          </InspectorSection>
          <InspectorSection title={t('inspector.escalation.reason')}>
            <TemplateField
              label={t('inspector.escalation.reason')}
              value={config.reason}
              variables={variables}
              hint={null}
              issue={issue(IssuePathSegment.Reason)}
              placeholder={null}
              onChange={(reason) => onTemplateChange({ reason })}
              onCommit={onCommit}
            />
          </InspectorSection>
          <InspectorSection title={t('inspector.escalation.until')}>
            <HandoffWaitFields
              label={t('inspector.escalation.until')}
              handoff={config}
              variables={variables}
              fallbackIssue={issue(IssuePathSegment.FallbackMessage)}
              onFallbackMessageChange={(fallbackMessage) => onTemplateChange({ fallbackMessage })}
              onCommit={onCommit}
            />
          </InspectorSection>
        </>
      )}
    </>
  );
}
