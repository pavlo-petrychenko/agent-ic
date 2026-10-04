import { Reflector } from '@nestjs/core';
import type { JobData, JobSchedule } from '@/platform/queues/typedefs/job.typedefs';

export const ScheduleJob = Reflector.createDecorator<JobSchedule<JobData>>();
