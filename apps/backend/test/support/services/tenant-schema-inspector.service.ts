import { sql } from 'drizzle-orm';
import { DatabaseRole } from '@/platform/db/database.constants';
import type { SqlExecutor } from '@/platform/db/database.typedefs';
import { MIGRATIONS_SCHEMA } from '@/platform/db/migrator/migrator.constants';
import { WORKSPACE_ID_COLUMN } from '@/platform/db/tenancy/tenancy.constants';
import {
  INSPECTED_TABLE_KINDS,
  TENANT_EXEMPT_TABLES,
} from '@test/support/constants/tenant-schema.constants';
import { qualifiedTableName, toViolation } from '@test/support/helpers/tenant-schema.helpers';
import type {
  TenantSchemaViolation,
  TenantTableRow,
} from '@test/support/typedefs/tenant-schema.typedefs';

export class TenantSchemaInspectorService {
  constructor(private readonly db: SqlExecutor) {}

  async findViolations(): Promise<TenantSchemaViolation[]> {
    const rows = await this.db.execute<TenantTableRow>(sql`
      select
        n.nspname as "schemaName",
        c.relname as "tableName",
        c.relrowsecurity as "rlsEnabled",
        c.relforcerowsecurity as "rlsForced",
        exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = ${WORKSPACE_ID_COLUMN} and not a.attisdropped
        ) as "hasWorkspaceId",
        exists (select 1 from pg_policy p where p.polrelid = c.oid) as "hasPolicy"
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      where c.relkind::text in ${INSPECTED_TABLE_KINDS}
        and r.rolname = ${DatabaseRole.Owner}
        and n.nspname <> ${MIGRATIONS_SCHEMA}
      order by n.nspname, c.relname
    `);
    return rows
      .filter((row) => !TENANT_EXEMPT_TABLES.includes(qualifiedTableName(row)))
      .map(toViolation)
      .filter((violation) => violation.problems.length > 0);
  }
}
