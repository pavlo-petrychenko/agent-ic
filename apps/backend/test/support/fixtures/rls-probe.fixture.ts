import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { text, uuid } from 'drizzle-orm/pg-core';
import { DatabaseRole } from '@/platform/db/database.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/db/tenancy/tenancy.helpers';
import { PROBE_TABLE, ProbeColumn } from '@test/support/constants/rls-probe.constants';

export const createProbeTable = (schemaName: string) => {
  const schema = moduleSchema(schemaName);
  const table = schema
    .table(
      PROBE_TABLE,
      {
        id: uuid(ProbeColumn.Id).primaryKey(),
        workspaceId: workspaceIdColumn(),
        label: text(ProbeColumn.Label).notNull(),
      },
      () => [tenantIsolationPolicy(PROBE_TABLE)],
    )
    .enableRLS();
  return { schema, table };
};

export type ProbeTable = ReturnType<typeof createProbeTable>;

export const probeTableStatements = async ({ schema, table }: ProbeTable): Promise<SQL[]> => {
  const generated = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson({ schema, table }),
  );
  const roles = sql.join(
    [sql.identifier(DatabaseRole.App), sql.identifier(DatabaseRole.System)],
    sql`, `,
  );
  return [
    ...generated.map((statement) => sql.raw(statement)),
    sql`alter table ${table} force row level security`,
    sql`grant usage on schema ${sql.identifier(schema.schemaName)} to ${roles}`,
    sql`grant select, insert, update, delete on ${table} to ${roles}`,
  ];
};
