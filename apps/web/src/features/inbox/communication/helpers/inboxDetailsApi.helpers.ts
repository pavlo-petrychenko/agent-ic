import type { InboxConversationQuery } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import { duration, runTime } from '@/features/inbox/communication/helpers/inboxFormat.helpers';
import {
  InboxGuardKind,
  InboxNotifyChannel,
  InboxReplyTarget,
} from '@/features/inbox/constants/inbox.constants';
import type { InboxGuard, InboxNotified, InboxRun } from '@/features/inbox/typedefs/inbox.typedefs';
import {
  ApiReplyMode,
  InboxNotifyChannel as ApiInboxNotifyChannel,
  InboxRunNodeType,
} from '@/shared/api/generated/schema.generated';
import { IconName } from '@/shared/ui/foundations/Icon';

type ApiDetails = InboxConversationQuery['inboxConversation']['details'];
type ApiNotified = ApiDetails['notified'];

const RUN_NODE_ICON: Readonly<Record<InboxRunNodeType, IconName>> = {
  trigger_message: IconName.Msg,
  trigger_external_event: IconName.Bolt,
  trigger_schedule: IconName.Cal,
  trigger_inactivity: IconName.Hour,
  agent: IconName.Agent,
  completion: IconName.Compl,
  router: IconName.Router,
  parallel: IconName.Par,
  api_request: IconName.Api,
  send_message: IconName.Send,
  escalation: IconName.Hand,
};

const REPLY_TARGET: Readonly<Record<ApiReplyMode, InboxReplyTarget>> = {
  [ApiReplyMode.Response]: InboxReplyTarget.Response,
  [ApiReplyMode.Webhook]: InboxReplyTarget.Webhook,
};

const NOTIFY_CHANNEL: Readonly<Record<ApiInboxNotifyChannel, InboxNotifyChannel>> = {
  [ApiInboxNotifyChannel.InPlatform]: InboxNotifyChannel.InPlatform,
  [ApiInboxNotifyChannel.Email]: InboxNotifyChannel.Email,
  [ApiInboxNotifyChannel.Telegram]: InboxNotifyChannel.Telegram,
};

const GUARD_KIND: Readonly<Partial<Record<InboxRunNodeType, InboxGuardKind>>> = {
  [InboxRunNodeType.Completion]: InboxGuardKind.Completion,
  [InboxRunNodeType.Agent]: InboxGuardKind.Agent,
  [InboxRunNodeType.Escalation]: InboxGuardKind.Escalation,
};

export const guardOf = (guard: ApiDetails['guard']): InboxGuard | null =>
  guard === null
    ? null
    : {
        label: guard.label,
        kind: GUARD_KIND[guard.nodeType] ?? InboxGuardKind.Completion,
        reason: guard.reason,
      };

export const notifiedOf = (notified: ApiNotified): InboxNotified | null =>
  notified === null
    ? null
    : {
        names: notified.names,
        allOperators: notified.allOperators,
        channels: notified.channels.map((channel) => NOTIFY_CHANNEL[channel]),
      };

export const replyTargetOf = (target: ApiReplyMode | null): InboxReplyTarget | null =>
  target === null ? null : REPLY_TARGET[target];

export const runOf = (details: ApiDetails, locale: string): InboxRun | null =>
  details.run === null
    ? null
    : {
        id: details.run.id,
        agentVersion: details.run.agentVersion,
        time: runTime(details.run.startedAt, locale),
        duration: duration(details.run.durationMs, locale),
        steps: details.run.steps.map((step) => ({
          id: step.id,
          icon: step.nodeType === null ? IconName.Box : RUN_NODE_ICON[step.nodeType],
          label: step.label,
          value: step.value,
        })),
      };
