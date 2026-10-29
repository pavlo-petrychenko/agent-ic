import { AgentsModule, SimulatorTestsReader } from '@/modules/agents';
import { ConversationsModule } from '@/modules/conversations';
import { PromptsModule } from '@/modules/prompts';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { ArmInactivityOnHandBackListener } from '@/modules/runs/listeners/arm-inactivity-on-hand-back.listener';
import { StartRunOnMessageListener } from '@/modules/runs/listeners/start-run-on-message.listener';
import { ExecuteProactiveRunProcessor } from '@/modules/runs/processors/execute-proactive-run.processor';
import { ExecuteRunProcessor } from '@/modules/runs/processors/execute-run.processor';
import { FireInactivityTimerProcessor } from '@/modules/runs/processors/fire-inactivity-timer.processor';
import { SweepInactivityTimersProcessor } from '@/modules/runs/processors/sweep-inactivity-timers.processor';
import { InactivitySweepRepository } from '@/modules/runs/repositories/inactivity-sweep.repository';
import { InactivityTimersRepository } from '@/modules/runs/repositories/inactivity-timers.repository';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { LastSimulationRunResolver } from '@/modules/runs/resolvers/last-simulation-run.resolver';
import { RunFieldsResolver } from '@/modules/runs/resolvers/run-fields.resolver';
import { RunStepsResolver } from '@/modules/runs/resolvers/run-steps.resolver';
import { RunResolver } from '@/modules/runs/resolvers/run.resolver';
import { SimulateSilenceResolver } from '@/modules/runs/resolvers/simulate-silence.resolver';
import { SimulationRunsResolver } from '@/modules/runs/resolvers/simulation-runs.resolver';
import { AgentExecutor } from '@/modules/runs/services/agent-executor.service';
import { ApiRequestExecutor } from '@/modules/runs/services/api-request-executor.service';
import { CompletionExecutor } from '@/modules/runs/services/completion-executor.service';
import { ConversationExitService } from '@/modules/runs/services/conversation-exit.service';
import { EscalationExecutor } from '@/modules/runs/services/escalation-executor.service';
import { InactivityFiringService } from '@/modules/runs/services/inactivity-firing.service';
import { InactivityTimersService } from '@/modules/runs/services/inactivity-timers.service';
import { InactivityTriggerExecutor } from '@/modules/runs/services/inactivity-trigger-executor.service';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { ParallelExecutor } from '@/modules/runs/services/parallel-executor.service';
import { RouterExecutor } from '@/modules/runs/services/router-executor.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import { RunMetricsService } from '@/modules/runs/services/run-metrics.service';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import { ScheduleTriggerExecutor } from '@/modules/runs/services/schedule-trigger-executor.service';
import { SendMessageExecutor } from '@/modules/runs/services/send-message-executor.service';
import { SimulationTestsReaderService } from '@/modules/runs/services/simulation-tests-reader.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { ArmInactivityOnHandBackUseCase } from '@/modules/runs/use-cases/arm-inactivity-on-hand-back.use-case';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import { FireInactivityTimerUseCase } from '@/modules/runs/use-cases/fire-inactivity-timer.use-case';
import { GetRunTotalsUseCase } from '@/modules/runs/use-cases/get-run-totals.use-case';
import { GetRunUseCase } from '@/modules/runs/use-cases/get-run.use-case';
import { ListLastSimulationRunsUseCase } from '@/modules/runs/use-cases/list-last-simulation-runs.use-case';
import { ListRunStepsUseCase } from '@/modules/runs/use-cases/list-run-steps.use-case';
import { ListSimulationRunsUseCase } from '@/modules/runs/use-cases/list-simulation-runs.use-case';
import { SimulateSilenceUseCase } from '@/modules/runs/use-cases/simulate-silence.use-case';
import { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import { SubscribeToRunStepsUseCase } from '@/modules/runs/use-cases/subscribe-to-run-steps.use-case';
import { SweepInactivityTimersUseCase } from '@/modules/runs/use-cases/sweep-inactivity-timers.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class RunsModule extends defineModule({
  imports: [AgentsModule, ConversationsModule, PromptsModule],
  providers: [
    RunsRepository,
    RunStepsRepository,
    InactivityTimersRepository,
    InactivitySweepRepository,
    MessageTriggerExecutor,
    InactivityTriggerExecutor,
    RouterExecutor,
    ParallelExecutor,
    ApiRequestExecutor,
    RunMessagesService,
    ConversationExitService,
    SendMessageExecutor,
    EscalationExecutor,
    CompletionExecutor,
    AgentExecutor,
    ScheduleTriggerExecutor,
    {
      provide: STEP_EXECUTORS,
      useFactory: (...executors: readonly StepExecutor[]) => executors,
      inject: [
        MessageTriggerExecutor,
        InactivityTriggerExecutor,
        RouterExecutor,
        ParallelExecutor,
        ApiRequestExecutor,
        SendMessageExecutor,
        EscalationExecutor,
        CompletionExecutor,
        AgentExecutor,
        ScheduleTriggerExecutor,
      ],
    },
    StepExecutorRegistry,
    RunMetricsService,
    RunExecutionService,
    InactivityTimersService,
    InactivityFiringService,
    RunLifecycleService,
    RunViewsService,
    { provide: SimulatorTestsReader, useClass: SimulationTestsReaderService },
    StartRunOnMessageUseCase,
    ArmInactivityOnHandBackUseCase,
    SweepInactivityTimersUseCase,
    FireInactivityTimerUseCase,
    SimulateSilenceUseCase,
    ExecuteRunUseCase,
    SubscribeToRunStepsUseCase,
    GetRunUseCase,
    ListSimulationRunsUseCase,
    ListRunStepsUseCase,
    GetRunTotalsUseCase,
    ListLastSimulationRunsUseCase,
  ],
  resolvers: [
    RunStepsResolver,
    RunResolver,
    RunFieldsResolver,
    SimulationRunsResolver,
    LastSimulationRunResolver,
    SimulateSilenceResolver,
  ],
  processors: [
    ExecuteRunProcessor,
    ExecuteProactiveRunProcessor,
    SweepInactivityTimersProcessor,
    FireInactivityTimerProcessor,
  ],
  listeners: [StartRunOnMessageListener, ArmInactivityOnHandBackListener],
}) {}
