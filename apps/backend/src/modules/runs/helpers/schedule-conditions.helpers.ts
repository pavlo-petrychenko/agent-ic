import type { TriggerScheduleNode } from '@agent-ic/flow';
import { CHANNEL_KIND_OF_TYPE, hasNeverEscalated } from '@/modules/conversations';
import type { Conversation } from '@/modules/conversations';
import { ScheduleConditionKind } from '@/modules/runs/constants/schedule-tick.constants';
import type { ScheduleConditionCheck } from '@/modules/runs/typedefs/simulator-schedule.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
} from '@/platform/clock/constants/time.constants';

export const scheduleConditionChecks = (
  conversation: Conversation,
  node: TriggerScheduleNode,
  now: Date,
): ScheduleConditionCheck[] => {
  const { silentForHours, notEscalated, channelTypes } = node.config.conditions;
  const { lastCustomerMessageAt } = conversation;
  const checks: ScheduleConditionCheck[] = [
    { kind: ScheduleConditionKind.CustomerWrote, met: lastCustomerMessageAt !== null },
  ];
  if (silentForHours !== null) {
    const silentMs = silentForHours * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND;
    checks.push({
      kind: ScheduleConditionKind.SilentFor,
      met:
        lastCustomerMessageAt !== null &&
        now.getTime() - lastCustomerMessageAt.getTime() >= silentMs,
    });
  }
  if (notEscalated) {
    checks.push({ kind: ScheduleConditionKind.NotEscalated, met: hasNeverEscalated(conversation) });
  }
  checks.push({
    kind: ScheduleConditionKind.ChannelType,
    met: channelTypes.some((type) => CHANNEL_KIND_OF_TYPE[type] === conversation.channelKind),
  });
  return checks;
};
