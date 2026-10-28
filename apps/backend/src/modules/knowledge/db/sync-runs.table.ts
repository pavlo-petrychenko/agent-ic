import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { KNOWLEDGE_MIN_SYNC_DOCUMENT_COUNT } from '@/modules/knowledge/constants/knowledge.constants';
import {
  knowledgeSchema,
  knowledgeSyncStatusEnum,
  knowledgeSyncTriggerEnum,
} from '@/modules/knowledge/db/knowledge.pg-schema';
import { sources } from '@/modules/knowledge/db/sources.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

const minDocumentCount = sql.raw(String(KNOWLEDGE_MIN_SYNC_DOCUMENT_COUNT));

export const syncRuns = knowledgeSchema
  .table(
    'sync_runs',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      sourceId: uuid('source_id').notNull(),
      trigger: knowledgeSyncTriggerEnum('trigger').notNull(),
      status: knowledgeSyncStatusEnum('status').notNull(),
      startedAt: timestamp('started_at', { withTimezone: true }),
      finishedAt: timestamp('finished_at', { withTimezone: true }),
      documentsTotal: integer('documents_total').notNull().default(0),
      documentsIndexed: integer('documents_indexed').notNull().default(0),
      documentsSkipped: integer('documents_skipped').notNull().default(0),
      documentsFailed: integer('documents_failed').notNull().default(0),
      documentsRemoved: integer('documents_removed').notNull().default(0),
      errorCode: text('error_code'),
      errorMessage: text('error_message'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'sync_runs_workspace_id_source_id_sources_fk',
        columns: [table.workspaceId, table.sourceId],
        foreignColumns: [sources.workspaceId, sources.id],
      }).onDelete('cascade'),
      unique('sync_runs_workspace_id_id_key').on(table.workspaceId, table.id),
      check(
        'sync_runs_documents_total_nonnegative',
        sql`${table.documentsTotal} >= ${minDocumentCount}`,
      ),
      check(
        'sync_runs_documents_indexed_nonnegative',
        sql`${table.documentsIndexed} >= ${minDocumentCount}`,
      ),
      check(
        'sync_runs_documents_skipped_nonnegative',
        sql`${table.documentsSkipped} >= ${minDocumentCount}`,
      ),
      check(
        'sync_runs_documents_failed_nonnegative',
        sql`${table.documentsFailed} >= ${minDocumentCount}`,
      ),
      check(
        'sync_runs_documents_removed_nonnegative',
        sql`${table.documentsRemoved} >= ${minDocumentCount}`,
      ),
      index('sync_runs_workspace_id_source_id_idx').on(table.workspaceId, table.sourceId),
      index('sync_runs_source_id_created_at_idx').on(table.sourceId, table.createdAt),
      tenantIsolationPolicy('sync_runs'),
    ],
  )
  .enableRLS();
