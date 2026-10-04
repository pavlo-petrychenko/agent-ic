import { DiscoveryModule } from '@nestjs/core';
import { AdminModule } from '@/platform/admin/admin.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';
import { QueueBoardController } from '@/platform/queues/controllers/queue-board.controller';
import { JobExecutionService } from '@/platform/queues/services/job-execution.service';
import { JobHandlersService } from '@/platform/queues/services/job-handlers.service';
import { JobSchedulesService } from '@/platform/queues/services/job-schedules.service';
import { JobWorkersService } from '@/platform/queues/services/job-workers.service';
import { JobsService } from '@/platform/queues/services/jobs.service';
import { QueueBoardService } from '@/platform/queues/services/queue-board.service';
import { QueueMetricsService } from '@/platform/queues/services/queue-metrics.service';
import { QueuesService } from '@/platform/queues/services/queues.service';

export class QueuesModule extends defineModule({
  global: true,
  imports: [DiscoveryModule, AdminModule],
  providers: [QueuesService, JobsService],
  exports: [QueuesService, JobsService],
  controllers: [QueueBoardController],
  roleProviders: {
    [Role.Api]: [QueueBoardService, QueueMetricsService],
    [Role.Worker]: [
      JobHandlersService,
      JobExecutionService,
      JobWorkersService,
      JobSchedulesService,
    ],
  },
}) {}
