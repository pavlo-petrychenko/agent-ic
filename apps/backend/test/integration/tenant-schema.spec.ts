import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { DatabaseRole } from '@/platform/db/database.constants';
import type { SqlExecutor } from '@/platform/db/database.typedefs';
import { PROBE_TABLE } from '@test/support/constants/rls-probe.constants';
import {
  QUALIFIED_NAME_SEPARATOR,
  TenantSchemaProblem,
} from '@test/support/constants/tenant-schema.constants';
import { TEST_INFRASTRUCTURE_KEY } from '@test/support/constants/test-infrastructure.constants';
import { createProbeTable, probeTableStatements } from '@test/support/fixtures/rls-probe.fixture';
import { openScratchDatabase, rollbackAfter } from '@test/support/helpers/database-testing.helpers';
import { TenantSchemaInspectorService } from '@test/support/services/tenant-schema-inspector.service';
import type { TenantSchemaViolation } from '@test/support/typedefs/tenant-schema.typedefs';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

const BROKEN_SCHEMA = 'schema_probe_broken';
const COMPLIANT_SCHEMA = 'schema_probe_compliant';
const GRANTS_SCHEMA = 'schema_probe_grants';
const PLAIN_TABLE = 'plain_items';
const SELECT_PRIVILEGE = 'select';
const USAGE_PRIVILEGE = 'usage';

const qualified = (schemaName: string, tableName: string): string =>
  `${schemaName}${QUALIFIED_NAME_SEPARATOR}${tableName}`;

const findViolation = (
  violations: readonly TenantSchemaViolation[],
  table: string,
): TenantSchemaViolation | undefined => violations.find((violation) => violation.table === table);

const createPlainTable = async (tx: SqlExecutor, schemaName: string): Promise<void> => {
  await tx.execute(sql`create schema ${sql.identifier(schemaName)}`);
  await tx.execute(
    sql`create table ${sql.identifier(schemaName)}.${sql.identifier(PLAIN_TABLE)} (id uuid primary key)`,
  );
};

describe('tenant schema', () => {
  let owner: ScratchDatabase;

  beforeAll(() => {
    owner = openScratchDatabase(inject(TEST_INFRASTRUCTURE_KEY).ownerUrl);
  });

  afterAll(async () => {
    await owner.close();
  });

  it('has no tenant table without workspace_id or a forced policy after migrations', async () => {
    const violations = await new TenantSchemaInspectorService(owner.db).findViolations();

    expect(violations).toEqual([]);
  });

  it('reports a migrated table without workspace_id, row level security or a policy', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createPlainTable(tx, BROKEN_SCHEMA);

      const violations = await new TenantSchemaInspectorService(tx).findViolations();

      expect(findViolation(violations, qualified(BROKEN_SCHEMA, PLAIN_TABLE))?.problems).toEqual([
        TenantSchemaProblem.MissingWorkspaceId,
        TenantSchemaProblem.RlsDisabled,
        TenantSchemaProblem.RlsNotForced,
        TenantSchemaProblem.MissingPolicy,
      ]);
    });
  });

  it('accepts a table built with the tenant helpers and forced row level security', async () => {
    const probe = createProbeTable(COMPLIANT_SCHEMA);

    await rollbackAfter(owner.db, async (tx) => {
      for (const statement of await probeTableStatements(probe)) {
        await tx.execute(statement);
      }

      const violations = await new TenantSchemaInspectorService(tx).findViolations();

      expect(findViolation(violations, qualified(COMPLIANT_SCHEMA, PROBE_TABLE))).toBeUndefined();
    });
  });

  it('grants the application roles access to schemas and tables created by migrations', async () => {
    const table = qualified(GRANTS_SCHEMA, PLAIN_TABLE);

    await rollbackAfter(owner.db, async (tx) => {
      await createPlainTable(tx, GRANTS_SCHEMA);

      const privileges = await tx.execute<Record<string, boolean>>(sql`
        select
          has_schema_privilege(${DatabaseRole.App}, ${GRANTS_SCHEMA}, ${USAGE_PRIVILEGE}) as "appSchema",
          has_table_privilege(${DatabaseRole.App}, ${table}, ${SELECT_PRIVILEGE}) as "appTable",
          has_schema_privilege(${DatabaseRole.System}, ${GRANTS_SCHEMA}, ${USAGE_PRIVILEGE}) as "systemSchema",
          has_table_privilege(${DatabaseRole.System}, ${table}, ${SELECT_PRIVILEGE}) as "systemTable"
      `);

      expect([...privileges]).toEqual([
        { appSchema: true, appTable: true, systemSchema: true, systemTable: true },
      ]);
    });
  });
});
