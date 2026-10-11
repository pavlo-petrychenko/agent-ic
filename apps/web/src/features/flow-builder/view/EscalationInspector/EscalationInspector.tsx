import type { WorkspaceRole } from '@agent-ic/contracts';
import { EscalationMode, RecipientsKind } from '@agent-ic/flow';
import type { FlowIssue } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import {
  ESCALATION_MODES,
  OFFERED_NOTIFY_CHANNELS,
  OPERATORS_ROLE,
  RECIPIENT_ROLES,
} from '@/features/flow-builder/constants/escalation.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type { RecipientValue } from '@/features/flow-builder/typedefs/escalation.typedefs';
import type { EscalationInspectorProps } from '@/features/flow-builder/view/EscalationInspector/EscalationInspector.typedefs';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl';
import { RowList } from '@/shared/ui/display/RowList';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { Select } from '@/shared/ui/inputs/Select';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

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
  const message = (found: FlowIssue | null) =>
    found === null ? null : t(`issue.${found.code}`, { ...found.params });
  const recipientOption = (value: RecipientValue, role: WorkspaceRole | null) => {
    const name = t(`inspector.escalation.recipient.${value}`);
    const count = role === null ? undefined : counts?.get(role);
    return {
      value,
      label: count === undefined ? name : t('inspector.escalation.people', { name, count }),
    };
  };
  const minutes = (value: number | null) =>
    value === null
      ? t('inspector.escalation.never')
      : t('inspector.escalation.minutes', { count: value });

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
          error={message(issue(IssuePathSegment.CustomerMessage))}
          placeholder={null}
          onChange={onMessageChange}
          onCommit={onCommit}
        />
      </InspectorSection>
      {config.mode === EscalationMode.Escalate && (
        <>
          <InspectorSection title={t('inspector.escalation.notify')}>
            <Select
              aria-label={t('inspector.escalation.recipients')}
              value={recipients}
              options={[
                recipientOption(RecipientsKind.Operators, OPERATORS_ROLE),
                ...RECIPIENT_ROLES.map((role) => recipientOption(role, role)),
                ...(recipients === RecipientsKind.Users
                  ? [{ ...recipientOption(RecipientsKind.Users, null), disabled: true }]
                  : []),
              ]}
              onChange={(event) => onRecipientsChange(event.target.value)}
            />
            <div className="flex flex-wrap gap-3">
              {OFFERED_NOTIFY_CHANNELS.map((channel) => {
                const checked = config.notify.channels.includes(channel);
                const last = OFFERED_NOTIFY_CHANNELS.every(
                  (other) => other === channel || !config.notify.channels.includes(other),
                );
                return (
                  <Checkbox
                    key={channel}
                    label={t(`inspector.escalation.channel.${channel}`)}
                    checked={checked}
                    disabled={checked && last}
                    onCheckedChange={(on) => onChannelChange(channel, on)}
                  />
                );
              })}
            </div>
            <Text kind={TextKind.Caption} color={TextColor.Mute}>
              {t('inspector.escalation.notifyHint')}
            </Text>
          </InspectorSection>
          <InspectorSection title={t('inspector.escalation.reason')}>
            <TemplateField
              label={t('inspector.escalation.reason')}
              value={config.reason}
              variables={variables}
              hint={null}
              error={message(issue(IssuePathSegment.Reason))}
              placeholder={null}
              onChange={(reason) => onTemplateChange({ reason })}
              onCommit={onCommit}
            />
          </InspectorSection>
          <InspectorSection title={t('inspector.escalation.until')}>
            <RowList
              aria-label={t('inspector.escalation.until')}
              mono={false}
              rows={[
                {
                  id: IssuePathSegment.Reminder,
                  name: t('inspector.escalation.remindAfter'),
                  meta: minutes(config.reminderAfterMinutes),
                },
                {
                  id: IssuePathSegment.Fallback,
                  name: t('inspector.escalation.fallbackAfter'),
                  meta: minutes(config.fallbackAfterMinutes),
                },
              ]}
            />
            <TemplateField
              label={t('inspector.escalation.fallbackMessage')}
              value={config.fallbackMessage}
              variables={variables}
              hint={null}
              error={message(issue(IssuePathSegment.FallbackMessage))}
              placeholder={null}
              onChange={(fallbackMessage) => onTemplateChange({ fallbackMessage })}
              onCommit={onCommit}
            />
          </InspectorSection>
        </>
      )}
    </>
  );
}
