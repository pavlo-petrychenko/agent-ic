import { AGENT_OUTCOME_FIELD_NAME, AgentExitKind, EscalationMode, NodeType } from '@agent-ic/flow';
import type { FlowDocument, FlowEdge, FlowNode } from '@agent-ic/flow';
import { TraceExit } from '@/features/testing/constants/trace.constants';
import type { RunStepView } from '@/features/testing/typedefs/trace.typedefs';
import { RunStepStatus } from '@/shared/api/generated/schema.generated';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const agentOutcome = (output: Record<string, unknown>): AgentExitKind | null =>
  Object.values(AgentExitKind).find((kind) => kind === output[AGENT_OUTCOME_FIELD_NAME]) ?? null;

export const exitEdge = (
  flow: FlowDocument | null,
  nodeId: string,
  outcome: AgentExitKind,
): FlowEdge | null =>
  flow?.edges.find((edge) => edge.source === nodeId && edge.sourcePort === outcome) ?? null;

export const traceExit = (
  step: RunStepView,
  node: FlowNode | null,
  flow: FlowDocument | null,
): TraceExit | null => {
  if (step.status !== RunStepStatus.Succeeded || node === null) {
    return null;
  }
  if (node.type === NodeType.Escalation) {
    return node.config.mode === EscalationMode.End ? TraceExit.Ended : TraceExit.Escalated;
  }
  const outcome =
    node.type === NodeType.Agent && isRecord(step.output) ? agentOutcome(step.output) : null;
  if (outcome === null || exitEdge(flow, node.id, outcome) !== null) {
    return null;
  }
  return outcome === AgentExitKind.End ? TraceExit.DefaultEnd : TraceExit.DefaultHandoff;
};
