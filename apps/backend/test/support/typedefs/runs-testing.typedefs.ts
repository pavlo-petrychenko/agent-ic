import type { TestingModule } from '@nestjs/testing';
import type { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { IdService } from '@/platform/ids/services/id.service';

export interface RunsTestbed {
  readonly module: TestingModule;
  readonly ids: IdService;
  readonly tenants: TenantTransactionService;
  readonly runs: RunsRepository;
}
