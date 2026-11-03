import { NodeType, NotifyChannel } from '@agent-ic/flow';
import { toGraphqlApiReplyMode } from '@/modules/channels/helpers/channel-graphql.helpers';
import type { InboxDetails } from '@/modules/channels/typedefs/inbox-details.typedefs';
import { toGraphqlRunStepStatus } from '@/modules/runs';
import type {
  InboxConversationDetails,
  InboxNotifyChannel as GraphqlInboxNotifyChannel,
  InboxRunNodeType as GraphqlInboxRunNodeType,
} from '@/platform/graphql-server/generated/schema.generated';
import {
  InboxNotifyChannel as GraphqlNotifyChannel,
  InboxRunNodeType as GraphqlNodeType,
} from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_NODE_TYPE: Readonly<Record<NodeType, GraphqlInboxRunNodeType>> = {
  [NodeType.TriggerMessage]: GraphqlNodeType.TriggerMessage,
  [NodeType.TriggerExternalEvent]: GraphqlNodeType.TriggerExternalEvent,
  [NodeType.TriggerSchedule]: GraphqlNodeType.TriggerSchedule,
  [NodeType.TriggerInactivity]: GraphqlNodeType.TriggerInactivity,
  [NodeType.Agent]: GraphqlNodeType.Agent,
  [NodeType.Completion]: GraphqlNodeType.Completion,
  [NodeType.Router]: GraphqlNodeType.Router,
  [NodeType.Parallel]: GraphqlNodeType.Parallel,
  [NodeType.ApiRequest]: GraphqlNodeType.ApiRequest,
  [NodeType.SendMessage]: GraphqlNodeType.SendMessage,
  [NodeType.Escalation]: GraphqlNodeType.Escalation,
};

const GRAPHQL_NOTIFY_CHANNEL: Readonly<Record<NotifyChannel, GraphqlInboxNotifyChannel>> = {
  [NotifyChannel.InPlatform]: GraphqlNotifyChannel.InPlatform,
  [NotifyChannel.Email]: GraphqlNotifyChannel.Email,
  [NotifyChannel.Telegram]: GraphqlNotifyChannel.Telegram,
};

export const toGraphqlInboxDetails = (details: InboxDetails): InboxConversationDetails => ({
  guard:
    details.guard === null
      ? null
      : {
          label: details.guard.label,
          nodeType: GRAPHQL_NODE_TYPE[details.guard.nodeType],
          reason: details.guard.reason,
        },
  run:
    details.run === null
      ? null
      : {
          id: details.run.id,
          agentVersion: details.run.agentVersion,
          startedAt: details.run.startedAt?.toISOString() ?? null,
          durationMs: details.run.durationMs,
          steps: details.run.steps.map((step) => ({
            id: step.id,
            nodeId: step.nodeId,
            label: step.label,
            nodeType: step.nodeType === null ? null : GRAPHQL_NODE_TYPE[step.nodeType],
            status: toGraphqlRunStepStatus(step.status),
            value: step.value,
          })),
        },
  channelName: details.channelName,
  replyTarget: details.replyTarget === null ? null : toGraphqlApiReplyMode(details.replyTarget),
  notified:
    details.notified === null
      ? null
      : {
          names: [...details.notified.names],
          allOperators: details.notified.allOperators,
          channels: details.notified.channels.map((channel) => GRAPHQL_NOTIFY_CHANNEL[channel]),
        },
  handled:
    details.handled === null
      ? null
      : {
          name: details.handled.name,
          since: details.handled.since?.toISOString() ?? null,
          until: details.handled.until?.toISOString() ?? null,
        },
  runsCount: details.runsCount,
});
