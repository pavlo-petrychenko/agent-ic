import type { WorkspaceRole } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { AgentRuntimeReader } from '@/modules/agents';
import type { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import type { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import type { SimulatedChannelAdapter } from '@/modules/channels';
import type { IncomingMessagesService } from '@/modules/conversations';
import type { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import type {
  Conversation,
  NewConversation,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import type { Message, NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import type { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import type { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import type { NewRun, Run } from '@/modules/runs/typedefs/run.typedefs';
import type { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import type { ClockService } from '@/platform/clock/services/clock.service';
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
  readonly observer: ScriptedStepExecutor;
  readonly liveUpdates: LiveUpdatesService;
}

export interface ExecutableRun {
  readonly run: NewRun;
  readonly ctx: UseCaseCtx;
}

export interface RunLifecycleTestbed extends RunExecutionTestbed {
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

export interface RunChat {
  readonly conversation: Conversation | null;
  readonly messages: readonly (Message | null)[];
}

export interface RunsWorker {
  readonly app: INestApplication;
  readonly ids: IdService;
  readonly clock: ClockService;
  readonly tenants: TenantTransactionService;
  readonly agents: AgentsRepository;
  readonly versions: AgentVersionsRepository;
  readonly reader: AgentRuntimeReader;
  readonly incoming: IncomingMessagesService;
  readonly conversations: ConversationsRepository;
  readonly runs: RunsRepository;
  readonly steps: RunStepsRepository;
  readonly simulated: SimulatedChannelAdapter;
  readonly queues: QueuesService;
}

export interface WorkerAgent {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly versionId: string | null;
}

export interface SettledConversation {
  readonly conversation: Conversation;
  readonly run: Run | null;
  readonly sent: readonly string[];
}

export interface SeededMember {
  readonly name: string;
  readonly role: WorkspaceRole;
}

export interface StepWaiter {
  readonly runId: string;
  readonly nodeId: string;
  readonly resolve: () => void;
}

export interface StepWatch {
  readonly reached: Promise<void>;
}
