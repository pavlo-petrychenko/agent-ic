import { sql } from 'drizzle-orm';
import { DatabaseRole } from '@/platform/database/constants/database.constants';
import { MIGRATIONS_SCHEMA } from '@/platform/database/constants/migration.constants';
import { WORKSPACE_ID_COLUMN } from '@/platform/database/constants/tenant.constants';
import type { SqlExecutor } from '@/platform/database/typedefs/database.typedefs';
import {
  FOREIGN_KEY_CONSTRAINT_TYPE,
  FOREIGN_KEY_EXEMPT_COLUMNS,
  ID_COLUMN_SUFFIX,
  UUID_TYPE,
  WORKSPACE_ID_TARGET_COLUMN,
  WORKSPACE_KEY_EXEMPT_TABLES,
  WORKSPACES_TABLE,
} from '@test/support/constants/foreign-keys.constants';
import {
  INSPECTED_TABLE_KINDS,
  QUALIFIED_NAME_SEPARATOR,
  TENANT_EXEMPT_TABLES,
} from '@test/support/constants/tenant-schema.constants';
import type { QualifiedNameRow } from '@test/support/typedefs/foreign-keys.typedefs';

export class ForeignKeyInspectorService {
  constructor(private readonly db: SqlExecutor) {}

  async findIdColumnsWithoutKey(): Promise<string[]> {
    const rows = await this.db.execute<QualifiedNameRow>(sql`
      select concat_ws(${QUALIFIED_NAME_SEPARATOR}, n.nspname, c.relname, a.attname) as "name"
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      where c.relkind::text in ${INSPECTED_TABLE_KINDS}
        and r.rolname = ${DatabaseRole.Owner}
        and n.nspname <> ${MIGRATIONS_SCHEMA}
        and a.attnum > 0
        and not a.attisdropped
        and a.atttypid = ${UUID_TYPE}::regtype
        and a.attname like ${ID_COLUMN_SUFFIX}
        and not exists (
          select 1 from pg_constraint k
          where k.conrelid = c.oid
            and k.contype = ${FOREIGN_KEY_CONSTRAINT_TYPE}
            and a.attnum = any (k.conkey)
        )
      order by 1
    `);
    return rows.map((row) => row.name).filter((name) => !FOREIGN_KEY_EXEMPT_COLUMNS.includes(name));
  }

  async findTenantTablesWithoutWorkspaceKey(): Promise<string[]> {
    const rows = await this.db.execute<QualifiedNameRow>(sql`
      select concat_ws(${QUALIFIED_NAME_SEPARATOR}, n.nspname, c.relname) as "name"
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      join pg_attribute a
        on a.attrelid = c.oid and a.attname = ${WORKSPACE_ID_COLUMN} and not a.attisdropped
      where c.relkind::text in ${INSPECTED_TABLE_KINDS}
        and r.rolname = ${DatabaseRole.Owner}
        and n.nspname <> ${MIGRATIONS_SCHEMA}
        and not exists (
          select 1 from pg_constraint k
          join pg_attribute target
            on target.attrelid = k.confrelid and target.attnum = k.confkey[1]
          where k.conrelid = c.oid
            and k.contype = ${FOREIGN_KEY_CONSTRAINT_TYPE}
            and k.conkey = array[a.attnum]
            and k.confrelid = ${WORKSPACES_TABLE}::regclass
            and target.attname = ${WORKSPACE_ID_TARGET_COLUMN}
        )
      order by 1
    `);
    return rows
      .map((row) => row.name)
      .filter(
        (name) =>
          !WORKSPACE_KEY_EXEMPT_TABLES.includes(name) && !TENANT_EXEMPT_TABLES.includes(name),
      );
  }

  async findKeysWithoutIndex(): Promise<string[]> {
    const rows = await this.db.execute<QualifiedNameRow>(sql`
      select concat_ws(${QUALIFIED_NAME_SEPARATOR}, n.nspname, c.relname, k.conname) as "name"
      from pg_constraint k
      join pg_class c on c.oid = k.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      where k.contype = ${FOREIGN_KEY_CONSTRAINT_TYPE}
        and r.rolname = ${DatabaseRole.Owner}
        and n.nspname <> ${MIGRATIONS_SCHEMA}
        and not exists (
          select 1 from pg_index i
          cross join lateral (
            select (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(k.conkey)] as leading
          ) l
          where i.indrelid = k.conrelid
            and l.leading @> k.conkey
            and l.leading <@ k.conkey
        )
      order by 1
    `);
    return rows.map((row) => row.name);
  }

  async findRedundantIndexes(): Promise<string[]> {
    const rows = await this.db.execute<QualifiedNameRow>(sql`
      select concat_ws(${QUALIFIED_NAME_SEPARATOR}, n.nspname, c.relname, ic.relname) as "name"
      from pg_index i
      join pg_class ic on ic.oid = i.indexrelid
      join pg_class c on c.oid = i.indrelid
      join pg_namespace n on n.oid = c.relnamespace
      join pg_roles r on r.oid = c.relowner
      where r.rolname = ${DatabaseRole.Owner}
        and n.nspname <> ${MIGRATIONS_SCHEMA}
        and not i.indisunique
        and i.indexprs is null
        and exists (
          select 1 from pg_index j
          where j.indrelid = i.indrelid
            and j.indexrelid <> i.indexrelid
            and j.indisvalid
            and pg_get_expr(j.indpred, j.indrelid) is not distinct from pg_get_expr(i.indpred, i.indrelid)
            and (string_to_array(j.indkey::text, ' ')::int2[])[1:i.indnkeyatts]
              = (string_to_array(i.indkey::text, ' ')::int2[])[1:i.indnkeyatts]
            and (
              j.indnkeyatts > i.indnkeyatts
              or (
                j.indnkeyatts = i.indnkeyatts
                and (j.indisunique or j.indexrelid < i.indexrelid)
              )
            )
        )
      order by 1
    `);
    return rows.map((row) => row.name);
  }
}
