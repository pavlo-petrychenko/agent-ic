import { CHANNEL_KIND_OF_TYPE } from '@/modules/conversations/constants/schedule-audience.constants';
import type {
  ScheduleAudienceRequest,
  ScheduleCandidateQuery,
} from '@/modules/conversations/typedefs/schedule-audience.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_HOUR,
} from '@/platform/clock/constants/time.constants';

export const toScheduleCandidateQuery = ({
  agentId,
  node,
  tick,
}: ScheduleAudienceRequest): ScheduleCandidateQuery => {
  const { conditions, maxConversationsPerRun, oncePerConversation } = node.config;
  return {
    agentId,
    nodeId: node.id,
    tick,
    silentSince:
      conditions.silentForHours === null
        ? null
        : new Date(
            tick.getTime() - conditions.silentForHours * SECONDS_PER_HOUR * MILLISECONDS_PER_SECOND,
          ),
    notEscalated: conditions.notEscalated,
    channelKinds: conditions.channelTypes.map((type) => CHANNEL_KIND_OF_TYPE[type]),
    oncePerConversation,
    limit: maxConversationsPerRun,
  };
};
