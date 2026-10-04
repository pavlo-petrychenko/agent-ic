import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind, SystemReason } from '@/platform/context/constants/actor.constants';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ENVELOPE_VERSION } from '@/platform/queues/constants/job.constants';
import { QueueLogMessage } from '@/platform/queues/constants/queue.constants';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { ScheduleJob } from '@/platform/queues/decorators/schedule-job.decorator';
import { jobKey } from '@/platform/queues/helpers/job.helpers';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobData, JobEnvelope, JobSchedule } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobSchedulesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobSchedulesService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly queues: QueuesService,
    private readonly traceIds: TraceIdService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const { config } = this.config;
    if (config.role !== Role.Worker) {
      return;
    }
    for (const schedule of this.discoverSchedules()) {
      if (config.queues.includes(schedule.job.queue)) {
        await this.register(schedule);
      }
    }
  }

  private discoverSchedules(): JobSchedule<JobData>[] {
    return this.discovery
      .getProviders({ metadataKey: ProcessJob.KEY })
      .flatMap((wrapper) =>
        typeof wrapper.metatype === 'function'
          ? (this.reflector.get(ScheduleJob, wrapper.metatype) ?? [])
          : [],
      );
  }

  private async register(schedule: JobSchedule<JobData>): Promise<void> {
    const { job } = schedule;
    const envelope: JobEnvelope = {
      version: ENVELOPE_VERSION,
      data: job.schema.parse(schedule.data),
      workspaceId: null,
      traceId: this.traceIds.current(),
      initiatedBy: { kind: ActorKind.System, reason: SystemReason.Schedule },
    };
    await this.queues
      .get(job.queue)
      .upsertJobScheduler(
        jobKey(job.queue, job.name),
        { every: schedule.everySeconds * MILLISECONDS_PER_SECOND },
        { name: job.name, data: envelope },
      );
    this.logger.log({
      msg: QueueLogMessage.ScheduleRegistered,
      queue: job.queue,
      job: job.name,
      everySeconds: schedule.everySeconds,
    });
  }
}
