import type { TestingModule } from '@nestjs/testing';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';
import type { ManualClock } from '@test/support/fakes/manual-clock.fake';

export interface KnowledgeTestbed {
  readonly module: TestingModule;
  readonly clock: ManualClock;
  readonly tenants: TenantTransactionService;
  readonly ids: IdService;
}
