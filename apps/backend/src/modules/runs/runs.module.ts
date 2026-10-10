import { AgentsModule } from '@/modules/agents';
import { ConversationsModule } from '@/modules/conversations';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { StartRunOnMessageListener } from '@/modules/runs/listeners/start-run-on-message.listener';
import { ExecuteRunProcessor } from '@/modules/runs/processors/execute-run.processor';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { RunExecutionService } from '@/modules/runs/services/run-execution.service';
import { RunLifecycleService } from '@/modules/runs/services/run-lifecycle.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { ExecuteRunUseCase } from '@/modules/runs/use-cases/execute-run.use-case';
import { StartRunOnMessageUseCase } from '@/modules/runs/use-cases/start-run-on-message.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class RunsModule extends defineModule({
  imports: [AgentsModule, ConversationsModule],
  providers: [
    RunsRepository,
    RunStepsRepository,
    MessageTriggerExecutor,
    {
      provide: STEP_EXECUTORS,
      useFactory: (...executors: readonly StepExecutor[]) => executors,
      inject: [MessageTriggerExecutor],
    },
    StepExecutorRegistry,
    RunExecutionService,
    RunLifecycleService,
    StartRunOnMessageUseCase,
    ExecuteRunUseCase,
  ],
  processors: [ExecuteRunProcessor],
  listeners: [StartRunOnMessageListener],
}) {}
