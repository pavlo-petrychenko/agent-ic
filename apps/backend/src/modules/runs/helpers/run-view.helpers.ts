import { IdPrefix } from '@agent-ic/contracts';
import type { RunStepView, RunTotals, RunView } from '@/modules/runs/typedefs/run-details.typedefs';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';

export const durationMs = (startedAt: Date | null, finishedAt: Date | null): number | null =>
  startedAt === null || finishedAt === null ? null : finishedAt.getTime() - startedAt.getTime();

const toRunStepView = (ids: IdService, step: RunStep): RunStepView => ({
  id: ids.toPublic(IdPrefix.RunStep, step.id),
  nodeId: step.nodeId,
  nodeKey: step.nodeKey,
  branchKey: step.branchKey,
  status: step.status,
  attempt: step.attempt,
  output: step.output,
  port: step.port,
  error: step.error,
  startedAt: step.startedAt,
  finishedAt: step.finishedAt,
  durationMs: durationMs(step.startedAt, step.finishedAt),
});

export const toRunView = (
  ids: IdService,
  run: Run,
  steps: readonly RunStep[],
  totals: RunTotals,
): RunView => ({
  id: ids.toPublic(IdPrefix.Run, run.id),
  conversationId: ids.toPublic(IdPrefix.Conversation, run.conversationId),
  agentId: ids.toPublic(IdPrefix.Agent, run.agentId),
  versionId: ids.toPublic(IdPrefix.AgentVersion, run.versionId),
  status: run.status,
  error: run.error,
  createdAt: run.createdAt,
  startedAt: run.startedAt,
  finishedAt: run.finishedAt,
  durationMs: durationMs(run.startedAt, run.finishedAt),
  totals,
  steps: steps.map((step) => toRunStepView(ids, step)),
});
