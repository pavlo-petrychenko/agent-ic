import { Module } from '@nestjs/common';
import { WorkerAppModule } from '@/entrypoints/worker.app-module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ProbeJobsModule } from '@test/support/modules/probe-jobs.module';

@Module({
  imports: [WorkerAppModule, ProbeJobsModule.forRole(Role.Worker)],
})
export class ProbeWorkerModule {}
