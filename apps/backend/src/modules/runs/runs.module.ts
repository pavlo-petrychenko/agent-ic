import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { MessageTriggerExecutor } from '@/modules/runs/services/message-trigger-executor.service';
import { StepExecutorRegistry } from '@/modules/runs/services/step-executor-registry.service';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class RunsModule extends defineModule({
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
  ],
}) {}
