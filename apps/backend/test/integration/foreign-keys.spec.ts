import { sql, type SQL } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { WORKSPACE_ID_COLUMN } from '@/platform/database/constants/tenant.constants';
import type { SqlExecutor } from '@/platform/database/typedefs/database.typedefs';
import { QUALIFIED_NAME_SEPARATOR } from '@test/support/constants/tenant-schema.constants';
import { TEST_INFRASTRUCTURE_KEY } from '@test/support/constants/test-infrastructure.constants';
import { openScratchDatabase, rollbackAfter } from '@test/support/helpers/database-testing.helpers';
import { ForeignKeyInspectorService } from '@test/support/services/foreign-key-inspector.service';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

const PROBE_SCHEMA = 'foreign_key_probe';
const PARENT_TABLE = 'parents';
const CHILD_TABLE = 'children';
const CHILD_KEY = 'children_parent_id_fk';
const PARENT_COLUMN = 'parent_id';
const LABEL_COLUMN = 'label';
const NOTE_COLUMN = 'note';
const PREFIX_INDEX = 'children_workspace_id_idx';
const WIDER_INDEX = 'children_workspace_id_label_idx';
const WIDER_UNIQUE_INDEX = 'children_workspace_id_label_key';
const PARTIAL_INDEX = 'children_workspace_id_note_idx';
const EXPRESSION_INDEX = 'children_lower_label_idx';

const qualified = (...parts: readonly string[]): string => parts.join(QUALIFIED_NAME_SEPARATOR);

const createProbeTables = async (tx: SqlExecutor, withKey: boolean): Promise<void> => {
  const schema = sql.identifier(PROBE_SCHEMA);
  const parentKey = withKey
    ? sql`constraint ${sql.identifier(CHILD_KEY)} references ${schema}.${sql.identifier(PARENT_TABLE)} (id)`
    : sql``;
  await tx.execute(sql`create schema ${schema}`);
  await tx.execute(
    sql`create table ${schema}.${sql.identifier(PARENT_TABLE)} (id uuid primary key)`,
  );
  await tx.execute(sql`
    create table ${schema}.${sql.identifier(CHILD_TABLE)} (
      id uuid primary key,
      ${sql.identifier(WORKSPACE_ID_COLUMN)} uuid not null,
      ${sql.identifier(PARENT_COLUMN)} uuid ${parentKey},
      ${sql.identifier(LABEL_COLUMN)} text,
      ${sql.identifier(NOTE_COLUMN)} text
    )
  `);
};

const probeChildren = (): SQL =>
  sql`${sql.identifier(PROBE_SCHEMA)}.${sql.identifier(CHILD_TABLE)}`;

describe('foreign keys', () => {
  let owner: ScratchDatabase;

  beforeAll(() => {
    owner = openScratchDatabase(inject(TEST_INFRASTRUCTURE_KEY).ownerUrl);
  });

  afterAll(async () => {
    await owner.close();
  });

  it('gives every id column a foreign key after migrations', async () => {
    const columns = await new ForeignKeyInspectorService(owner.db).findIdColumnsWithoutKey();

    expect(columns).toEqual([]);
  });

  it('points every tenant table at its workspace after migrations', async () => {
    const tables = await new ForeignKeyInspectorService(
      owner.db,
    ).findTenantTablesWithoutWorkspaceKey();

    expect(tables).toEqual([]);
  });

  it('indexes every foreign key after migrations', async () => {
    const keys = await new ForeignKeyInspectorService(owner.db).findKeysWithoutIndex();

    expect(keys).toEqual([]);
  });

  it('reports an id column without a foreign key', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, false);

      const columns = await new ForeignKeyInspectorService(tx).findIdColumnsWithoutKey();

      expect(columns).toEqual(
        expect.arrayContaining([
          qualified(PROBE_SCHEMA, CHILD_TABLE, PARENT_COLUMN),
          qualified(PROBE_SCHEMA, CHILD_TABLE, WORKSPACE_ID_COLUMN),
        ]),
      );
    });
  });

  it('reports a tenant table whose workspace_id has no key to the workspaces', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, true);

      const tables = await new ForeignKeyInspectorService(tx).findTenantTablesWithoutWorkspaceKey();

      expect(tables).toContain(qualified(PROBE_SCHEMA, CHILD_TABLE));
    });
  });

  it('reports a foreign key without an index, and accepts it once indexed', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, true);
      const inspector = new ForeignKeyInspectorService(tx);

      const unindexed = await inspector.findKeysWithoutIndex();
      await tx.execute(
        sql`create index on ${sql.identifier(PROBE_SCHEMA)}.${sql.identifier(CHILD_TABLE)} (${sql.identifier(PARENT_COLUMN)})`,
      );
      const indexed = await inspector.findKeysWithoutIndex();

      const key = qualified(PROBE_SCHEMA, CHILD_TABLE, CHILD_KEY);
      expect(unindexed).toContain(key);
      expect(indexed).not.toContain(key);
    });
  });

  it('has no index that is a leading prefix of another index after migrations', async () => {
    const indexes = await new ForeignKeyInspectorService(owner.db).findRedundantIndexes();

    expect(indexes).toEqual([]);
  });

  it('reports an index that is a leading prefix of a wider index', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, true);
      await tx.execute(
        sql`create index ${sql.identifier(PREFIX_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)})`,
      );
      await tx.execute(
        sql`create index ${sql.identifier(WIDER_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)}, ${sql.identifier(LABEL_COLUMN)})`,
      );

      const indexes = await new ForeignKeyInspectorService(tx).findRedundantIndexes();

      expect(indexes).toEqual([qualified(PROBE_SCHEMA, CHILD_TABLE, PREFIX_INDEX)]);
    });
  });

  it('reports an index that is a prefix of a unique index', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, true);
      await tx.execute(
        sql`create index ${sql.identifier(PREFIX_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)}, ${sql.identifier(LABEL_COLUMN)})`,
      );
      await tx.execute(
        sql`create unique index ${sql.identifier(WIDER_UNIQUE_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)}, ${sql.identifier(LABEL_COLUMN)})`,
      );

      const indexes = await new ForeignKeyInspectorService(tx).findRedundantIndexes();

      expect(indexes).toEqual([qualified(PROBE_SCHEMA, CHILD_TABLE, PREFIX_INDEX)]);
    });
  });

  it('accepts a prefix index whose predicate differs, and ignores expression indexes', async () => {
    await rollbackAfter(owner.db, async (tx) => {
      await createProbeTables(tx, true);
      await tx.execute(
        sql`create index ${sql.identifier(PREFIX_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)})`,
      );
      await tx.execute(
        sql`create index ${sql.identifier(PARTIAL_INDEX)} on ${probeChildren()} (${sql.identifier(WORKSPACE_ID_COLUMN)}, ${sql.identifier(NOTE_COLUMN)}) where ${sql.identifier(NOTE_COLUMN)} is not null`,
      );
      await tx.execute(
        sql`create index ${sql.identifier(EXPRESSION_INDEX)} on ${probeChildren()} (lower(${sql.identifier(LABEL_COLUMN)}))`,
      );
      await tx.execute(
        sql`create index ${sql.identifier(WIDER_INDEX)} on ${probeChildren()} (lower(${sql.identifier(LABEL_COLUMN)}), ${sql.identifier(NOTE_COLUMN)})`,
      );

      const indexes = await new ForeignKeyInspectorService(tx).findRedundantIndexes();

      expect(indexes).toEqual([]);
    });
  });
});
