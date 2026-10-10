import type { TestingModule } from '@nestjs/testing';
import type {
  Conversation,
  NewConversation,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type { NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import type { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import type { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import type { NewRun, Run } from '@/modules/runs/typedefs/run.typedefs';
import type { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import type { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import type { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import type { QueuesService } from '@/platform/queues/services/queues.service';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';
import type { ScriptedStepExecutor } from '@test/support/fakes/scripted-step-executor.fake';

export interface RunsTestbed {
  readonly module: TestingModule;
  readonly ids: IdService;
  readonly tenants: TenantTransactionService;
  readonly runs: RunsRepository;
  readonly steps: RunStepsRepository;
}

export interface RunExecutionTestbed extends RunsTestbed {
  readonly clock: ManualClock;
  readonly execution: RunExecutionService;
  readonly executor: ScriptedStepExecutor;
  readonly liveUpdates: LiveUpdatesService;
}

export interface ExecutableRun {
  readonly run: NewRun;
  readonly ctx: UseCaseCtx;
}

export interface RunLifecycleTestbed extends RunExecutionTestbed {
  readonly startRunOnMessage: StartRunOnMessageUseCase;
  readonly executeRun: ExecuteRunUseCase;
  readonly queues: QueuesService;
}

export interface LiveConversation {
  readonly conversation: NewConversation;
  readonly versionId: string;
  readonly ctx: UseCaseCtx;
}

export interface ReceivedMessage {
  readonly message: NewMessage;
  readonly run: NewRun | null;
}

export interface LifecycleState {
  readonly conversation: Conversation | null;
  readonly latest: Run | null;
}
