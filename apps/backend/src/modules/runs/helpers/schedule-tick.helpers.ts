import { ModelProviderKind, NodeType, dueTick } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { LiveScheduleTrigger } from '@/modules/agents';
import {
  SCHEDULE_TICK_JOB_ID_PREFIX,
  SCHEDULE_TICK_JOB_ID_SEPARATOR,
} from '@/modules/runs/constants/schedule-tick.constants';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

export const scheduleTickJobId = (agentId: string, nodeId: string, tick: Date): string =>
  [
    SCHEDULE_TICK_JOB_ID_PREFIX,
    agentId,
    nodeId,
    String(Math.floor(tick.getTime() / MILLISECONDS_PER_SECOND)),
  ].join(SCHEDULE_TICK_JOB_ID_SEPARATOR);

export const usesPlatformModel = (flow: FlowDocument): boolean =>
  flow.nodes.some(
    (node) =>
      (node.type === NodeType.Agent || node.type === NodeType.Completion) &&
      node.config.model?.provider.kind === ModelProviderKind.Platform,
  );

export const stillSchedules = (trigger: LiveScheduleTrigger, tick: Date): boolean =>
  dueTick(trigger.node.config.schedule, {
    now: tick,
    notBefore: trigger.publishedAt,
  })?.tick.getTime() === tick.getTime();
