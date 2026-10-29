import { NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowNode, TriggerScheduleNode } from '@agent-ic/flow';
import type { ScheduleTrigger } from '@/features/testing/typedefs/schedule.typedefs';
import type { ScheduleRunResult } from '@/features/testing/typedefs/simulator.typedefs';

const isScheduleTrigger = (node: FlowNode): node is TriggerScheduleNode =>
  node.type === NodeType.TriggerSchedule;

export const scheduleTriggers = (flow: FlowDocument | null): readonly ScheduleTrigger[] =>
  (flow?.nodes ?? []).filter(isScheduleTrigger).map((node) => ({
    id: node.id,
    name: node.label === '' ? node.key : node.label,
    silentForHours: node.config.conditions.silentForHours,
    notEscalated: node.config.conditions.notEscalated,
  }));

export const scheduleNameOf = (
  triggers: readonly ScheduleTrigger[],
  results: readonly ScheduleRunResult[],
  runId: string,
): string | null => {
  const nodeId = results.find((result) => result.runId === runId)?.nodeId ?? null;
  const known = triggers.find((trigger) => trigger.id === nodeId);
  if (known !== undefined) {
    return known.name;
  }
  const [only, ...others] = triggers;
  return only !== undefined && others.length === 0 ? only.name : null;
};
