import type { Locale } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import type { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';

export interface UsageTestbed {
  readonly module: TestingModule;
  readonly clock: ManualClock;
  readonly emails: FakeEmailGateway;
  readonly tenants: TenantTransactionService;
  readonly ids: IdService;
}

export interface UsageTestOwner {
  readonly workspaceId: string;
  readonly userId: string;
  readonly email: string;
}

export interface UsageTestOwnerInput {
  readonly locale: Locale;
}
