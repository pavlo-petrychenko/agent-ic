import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunsModule } from '@/modules/runs/runs.module';
import type { NewRun } from '@/modules/runs/typedefs/run.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newRun } from '@test/support/fixtures/runs.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import type { RunsTestbed } from '@test/support/typedefs/runs-testing.typedefs';

export const createRunsTestbed = async (): Promise<RunsTestbed> => {
  const module = await createPlatformTestingModule(TestRedisPrefix.Runs, [
    RunsModule.forRole(Role.Worker),
  ]);
  return {
    module,
    ids: module.get(IdService),
    tenants: module.get(TenantTransactionService),
    runs: module.get(RunsRepository),
    steps: module.get(RunStepsRepository),
  };
};

export const seedRun = async (
  testbed: RunsTestbed,
  workspaceId: string = testbed.ids.generate(),
): Promise<NewRun> => {
  const run = newRun(testbed, workspaceId);
  await testbed.tenants.run(workspaceId, () => testbed.runs.insert(run));
  return run;
};
