import { TransactionHost, Transactional } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { APP_DATABASE } from '@/platform/database/constants/database-token.constants';
import { TenantMismatchError } from '@/platform/database/errors/tenant-mismatch.error';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_INFRASTRUCTURE_KEY } from '@test/support/constants/test-infrastructure.constants';
import { createProbeTable, probeTableStatements } from '@test/support/fixtures/rls-probe.fixture';
import {
  createDatabaseTestingModule,
  openScratchDatabase,
} from '@test/support/helpers/database-testing.helpers';
import { TestTransactionService } from '@test/support/services/test-transaction.service';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

const PROBE_SCHEMA = 'rls_probe_runner';
const SEEDED_LABEL = 'seeded';
const ROLLED_BACK_LABEL = 'rolled-back';
const ROW_LEVEL_SECURITY_VIOLATION = { cause: { code: '42501' } };

const probe = createProbeTable(PROBE_SCHEMA);

class ProbeFailure extends Error {}

class ProbeItemsWriter {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  @Transactional()
  async insert(id: string, workspaceId: string, label: string): Promise<void> {
    await this.txHost.tx.insert(probe.table).values({ id, workspaceId, label });
  }
}

describe('TenantTransactionService', () => {
  let superuser: ScratchDatabase;
  let testingModule: TestingModule;
  let runner: TenantTransactionService;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let appDb: AppDatabase;
  let systemDb: SystemDatabaseService;
  let ids: IdService;
  let writer: ProbeItemsWriter;
  let workspaceA: string;
  let workspaceB: string;

  const readVisibleWorkspaces = async (): Promise<string[]> => {
    const rows = await txHost.tx.select().from(probe.table);
    return rows.map((row) => row.workspaceId);
  };

  const countByLabel = async (label: string): Promise<number> => {
    const rows = await systemDb.db.select().from(probe.table).where(eq(probe.table.label, label));
    return rows.length;
  };

  beforeAll(async () => {
    superuser = openScratchDatabase(inject(TEST_INFRASTRUCTURE_KEY).superuserUrl);
    for (const statement of await probeTableStatements(probe)) {
      await superuser.db.execute(statement);
    }
    testingModule = await createDatabaseTestingModule();
    testingModule.useLogger(false);
    runner = testingModule.get(TenantTransactionService);
    txHost = testingModule.get(TransactionHost);
    appDb = testingModule.get<AppDatabase>(APP_DATABASE);
    systemDb = testingModule.get(SystemDatabaseService);
    ids = testingModule.get(IdService);
    writer = new ProbeItemsWriter(txHost);
    workspaceA = ids.generate();
    workspaceB = ids.generate();
    await systemDb.db.insert(probe.table).values([
      { id: ids.generate(), workspaceId: workspaceA, label: SEEDED_LABEL },
      { id: ids.generate(), workspaceId: workspaceA, label: SEEDED_LABEL },
      { id: ids.generate(), workspaceId: workspaceB, label: SEEDED_LABEL },
    ]);
  });

  afterAll(async () => {
    await superuser.db.execute(sql`drop schema ${sql.identifier(PROBE_SCHEMA)} cascade`);
    await testingModule.close();
    await superuser.close();
  });

  it('sees zero rows when no workspace is set', async () => {
    const rows = await appDb.select().from(probe.table);

    expect(rows).toEqual([]);
  });

  it('rejects a write when no workspace is set', async () => {
    const write = appDb
      .insert(probe.table)
      .values({ id: ids.generate(), workspaceId: workspaceA, label: ROLLED_BACK_LABEL });

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
  });

  it('shows only the rows of the transaction workspace', async () => {
    const visibleToA = await runner.run(workspaceA, readVisibleWorkspaces);
    const visibleToB = await runner.run(workspaceB, readVisibleWorkspaces);

    expect(visibleToA).toEqual([workspaceA, workspaceA]);
    expect(visibleToB).toEqual([workspaceB]);
  });

  it('rejects writing a row into another workspace', async () => {
    const write = runner.run(workspaceA, () =>
      writer.insert(ids.generate(), workspaceB, ROLLED_BACK_LABEL),
    );

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    expect(await countByLabel(ROLLED_BACK_LABEL)).toBe(0);
  });

  it('keeps the workspace setting inside its own transaction', async () => {
    await runner.run(workspaceA, readVisibleWorkspaces);

    const rowsAfter = await appDb.select().from(probe.table);

    expect(rowsAfter).toEqual([]);
  });

  it('leaves nothing behind when the work fails', async () => {
    const work = runner.run(workspaceA, async () => {
      await writer.insert(ids.generate(), workspaceA, ROLLED_BACK_LABEL);
      throw new ProbeFailure();
    });

    await expect(work).rejects.toThrow(ProbeFailure);
    expect(await countByLabel(ROLLED_BACK_LABEL)).toBe(0);
  });

  it('joins an open transaction of the same workspace', async () => {
    const visible = await runner.run(workspaceA, () =>
      runner.run(workspaceA, readVisibleWorkspaces),
    );

    expect(visible).toEqual([workspaceA, workspaceA]);
  });

  it('refuses to switch workspaces inside a transaction', async () => {
    const work = runner.run(workspaceA, () => runner.run(workspaceB, readVisibleWorkspaces));

    await expect(work).rejects.toThrow(TenantMismatchError);
  });

  it('lets the system database read every workspace', async () => {
    const rows = await systemDb.db.select().from(probe.table);

    expect(new Set(rows.map((row) => row.workspaceId))).toEqual(new Set([workspaceA, workspaceB]));
  });

  it('rolls back writes made inside a test transaction', async () => {
    const rollback = testingModule.get(TestTransactionService);

    await rollback.rollback(() =>
      runner.run(workspaceA, () => writer.insert(ids.generate(), workspaceA, ROLLED_BACK_LABEL)),
    );

    expect(await countByLabel(ROLLED_BACK_LABEL)).toBe(0);
  });
});
