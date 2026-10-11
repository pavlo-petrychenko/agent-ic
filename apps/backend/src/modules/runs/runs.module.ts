import { AgentsModule } from '@/modules/agents';
import { ConversationsModule } from '@/modules/conversations';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { StartRunOnMessageListener } from '@/modules/runs/listeners/start-run-on-message.listener';
import { ExecuteRunProcessor } from '@/modules/runs/processors/execute-run.processor';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunStepsResolver } from '@/modules/runs/resolvers/run-steps.resolver';
import { AgentExecutor } from '@/modules/runs/services/agent-executor.service';
import { ApiRequestExecutor } from '@/modules/runs/services/api-request-executor.service';
import { CompletionExecutor } from '@/modules/runs/services/completion-executor.service';
import { EscalationExecutor } from '@/modules/runs/services/escalation-executor.service';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { ParallelExecutor } from '@/modules/runs/services/parallel-executor.service';
import { RouterExecutor } from '@/modules/runs/services/router-executor.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import { SendMessageExecutor } from '@/modules/runs/services/send-message-executor.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
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
    StartRunOnMessageUseCase,
    ExecuteRunUseCase,
    SubscribeToRunStepsUseCase,
  ],
  resolvers: [RunStepsResolver],
  processors: [ExecuteRunProcessor],
  listeners: [StartRunOnMessageListener],
}) {}
