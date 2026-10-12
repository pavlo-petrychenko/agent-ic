import { AgentsModule, SimulatorTestsReader } from '@/modules/agents';
import { ConversationsModule } from '@/modules/conversations';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { CleanUpWorkspaceListener } from '@/modules/runs/listeners/clean-up-workspace.listener';
import { StartRunOnMessageListener } from '@/modules/runs/listeners/start-run-on-message.listener';
import { ExecuteRunProcessor } from '@/modules/runs/processors/execute-run.processor';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { LastSimulationRunResolver } from '@/modules/runs/resolvers/last-simulation-run.resolver';
import { RunStepsResolver } from '@/modules/runs/resolvers/run-steps.resolver';
import { RunResolver } from '@/modules/runs/resolvers/run.resolver';
import { SimulationRunsResolver } from '@/modules/runs/resolvers/simulation-runs.resolver';
import { AgentExecutor } from '@/modules/runs/services/agent-executor.service';
import { ApiRequestExecutor } from '@/modules/runs/services/api-request-executor.service';
import { CompletionExecutor } from '@/modules/runs/services/completion-executor.service';
import { EscalationExecutor } from '@/modules/runs/services/escalation-executor.service';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { ParallelExecutor } from '@/modules/runs/services/parallel-executor.service';
import { RouterExecutor } from '@/modules/runs/services/router-executor.service';
import { RunDetailsService } from '@/modules/runs/services/run-details.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import { SendMessageExecutor } from '@/modules/runs/services/send-message-executor.service';
import { SimulationTestsReaderService } from '@/modules/runs/services/simulation-tests-reader.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { CleanUpWorkspaceUseCase } from '@/modules/runs/use-cases/clean-up-workspace.use-case';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import { GetLastSimulationRunUseCase } from '@/modules/runs/use-cases/get-last-simulation-run.use-case';
import { GetRunUseCase } from '@/modules/runs/use-cases/get-run.use-case';
import { ListSimulationRunsUseCase } from '@/modules/runs/use-cases/list-simulation-runs.use-case';
import { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import { SubscribeToRunStepsUseCase } from '@/modules/runs/use-cases/subscribe-to-run-steps.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class RunsModule extends defineModule({
  imports: [AgentsModule, ConversationsModule],
  providers: [
    RunsRepository,
    RunStepsRepository,
    MessageTriggerExecutor,
    RouterExecutor,
    ParallelExecutor,
    ApiRequestExecutor,
    RunMessagesService,
    SendMessageExecutor,
    EscalationExecutor,
    CompletionExecutor,
    AgentExecutor,
    {
      provide: STEP_EXECUTORS,
      useFactory: (...executors: readonly StepExecutor[]) => executors,
      inject: [
        MessageTriggerExecutor,
        RouterExecutor,
        ParallelExecutor,
        ApiRequestExecutor,
        SendMessageExecutor,
        EscalationExecutor,
        CompletionExecutor,
        AgentExecutor,
      ],
    },
    StepExecutorRegistry,
    RunExecutionService,
    RunLifecycleService,
    RunViewsService,
    RunDetailsService,
    { provide: SimulatorTestsReader, useClass: SimulationTestsReaderService },
    StartRunOnMessageUseCase,
    ExecuteRunUseCase,
    SubscribeToRunStepsUseCase,
    GetRunUseCase,
    ListSimulationRunsUseCase,
    GetLastSimulationRunUseCase,
    CleanUpWorkspaceUseCase,
  ],
  resolvers: [RunStepsResolver, RunResolver, SimulationRunsResolver, LastSimulationRunResolver],
  processors: [ExecuteRunProcessor],
  listeners: [StartRunOnMessageListener, CleanUpWorkspaceListener],
}) {}
