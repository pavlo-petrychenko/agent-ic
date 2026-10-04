import { Module } from '@nestjs/common';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ProbeJobsModule } from '@test/support/modules/probe-jobs.module';

@Module({
  imports: [ProbeJobsModule.forRole(Role.Worker)],
})
export class ProbeWorkerModule {}
