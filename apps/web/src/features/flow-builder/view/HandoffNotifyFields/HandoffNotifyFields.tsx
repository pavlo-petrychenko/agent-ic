import type { WorkspaceRole } from '@agent-ic/contracts';
import { RecipientsKind } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import {
  OFFERED_NOTIFY_CHANNELS,
  OPERATORS_ROLE,
  RECIPIENT_ROLES,
} from '@/features/flow-builder/constants/escalation.constants';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import type { RecipientValue } from '@/features/flow-builder/typedefs/escalation.typedefs';
import type { HandoffNotifyFieldsProps } from '@/features/flow-builder/view/HandoffNotifyFields/HandoffNotifyFields.typedefs';
import { Checkbox } from '@/shared/ui/inputs/Checkbox';
import { Select } from '@/shared/ui/inputs/Select';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function HandoffNotifyFields({
  channels,
  recipients,
  counts,
  onRecipientsChange,
  onChannelChange,
}: HandoffNotifyFieldsProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const recipientOption = (value: RecipientValue, role: WorkspaceRole | null) => {
    const name = t(`inspector.escalation.recipient.${value}`);
    const count = role === null ? undefined : counts?.get(role);
    return {
      value,
      label: count === undefined ? name : t('inspector.escalation.people', { name, count }),
    };
  };

  return (
    <>
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
          const checked = channels.includes(channel);
          const last = OFFERED_NOTIFY_CHANNELS.every(
            (other) => other === channel || !channels.includes(other),
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
    </>
  );
}
