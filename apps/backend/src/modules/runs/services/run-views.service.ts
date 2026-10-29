import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { inactivityAttemptOf } from '@/modules/runs/helpers/inactivity-trigger.helpers';
import { durationMs } from '@/modules/runs/helpers/run-view.helpers';
import type { RunStepView, RunView } from '@/modules/runs/typedefs/run-details.typedefs';
import type { RunStep } from '@/modules/runs/typedefs/run-step.typedefs';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RunViewsService {
  constructor(private readonly ids: IdService) {}

  runView(run: Run): RunView {
    return {
      id: this.ids.toPublic(IdPrefix.Run, run.id),
      conversationId: this.ids.toPublic(IdPrefix.Conversation, run.conversationId),
      agentId: this.ids.toPublic(IdPrefix.Agent, run.agentId),
      versionId: this.ids.toPublic(IdPrefix.AgentVersion, run.versionId),
      trigger: run.trigger,
      inactivityAttempt: inactivityAttemptOf(run),
      status: run.status,
      error: run.error,
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      durationMs: durationMs(run.startedAt, run.finishedAt),
    };
  }

  stepView(step: RunStep): RunStepView {
    return {
      id: this.ids.toPublic(IdPrefix.RunStep, step.id),
      nodeId: step.nodeId,
      nodeKey: step.nodeKey,
      branchKey: step.branchKey,
      status: step.status,
      attempt: step.attempt,
      input: step.input,
      output: step.output,
      port: step.port,
      error: step.error,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
      durationMs: durationMs(step.startedAt, step.finishedAt),
    };
  }
}
