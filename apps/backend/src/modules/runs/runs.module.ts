import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class RunsModule extends defineModule({
  providers: [RunsRepository, RunStepsRepository],
}) {}
