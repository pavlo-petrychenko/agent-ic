import { NodeType, triggerScheduleNodeSchema } from '@agent-ic/flow';
import type { FlowDocument, TriggerScheduleNode } from '@agent-ic/flow';
import type {
  LiveScheduleTrigger,
  LiveScheduleTriggerRow,
} from '@/modules/agents/typedefs/schedule-trigger.typedefs';

export const toLiveScheduleTriggers = (row: LiveScheduleTriggerRow): LiveScheduleTrigger[] => {
  const { publishedAt } = row;
  if (publishedAt === null) {
    return [];
  }
  return row.scheduleNodes.flatMap((raw) => {
    const parsed = triggerScheduleNodeSchema.safeParse(raw);
    return parsed.success
      ? [
          {
            workspaceId: row.workspaceId,
            agentId: row.agentId,
            versionId: row.versionId,
            publishedAt,
            node: parsed.data,
          },
        ]
      : [];
  });
};

export const scheduleNodeOf = (flow: FlowDocument, nodeId: string): TriggerScheduleNode | null =>
  flow.nodes.find(
    (node): node is TriggerScheduleNode =>
      node.id === nodeId && node.type === NodeType.TriggerSchedule,
  ) ?? null;
