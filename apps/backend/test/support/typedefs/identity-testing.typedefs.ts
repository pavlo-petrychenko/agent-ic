import type { TestingModule } from '@nestjs/testing';
import type { Queue } from 'bullmq';
import type { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';

export interface IdentityTestbed {
  readonly module: TestingModule;
  readonly clock: ManualClock;
  readonly emails: FakeEmailGateway;
  readonly db: AppDatabase;
  readonly notifyQueue: Queue<JobEnvelope>;
}

export interface TestAccount {
  readonly userId: string;
  readonly email: string;
  readonly password: string;
  readonly browserBinding: string;
}
