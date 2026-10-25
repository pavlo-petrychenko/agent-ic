import { isNotNull, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  KnowledgeSourceKind,
  KnowledgeSyncInterval,
  KnowledgeSyncMode,
} from '@/modules/knowledge/constants/knowledge.constants';
import { connections } from '@/modules/knowledge/db/connections.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import {
  knowledgeSchema,
  knowledgeSourceKindEnum,
  knowledgeSourceStatusEnum,
  knowledgeSyncIntervalEnum,
  knowledgeSyncModeEnum,
} from '@/modules/knowledge/db/knowledge.pg-schema';
import { toSqlLiteral } from '@/platform/database/helpers/tenant-sql.helpers';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

const upload = sql.raw(toSqlLiteral(KnowledgeSourceKind.Upload));
const googleDocs = sql.raw(toSqlLiteral(KnowledgeSourceKind.GoogleDocs));
const manual = sql.raw(toSqlLiteral(KnowledgeSyncMode.Manual));
const scheduled = sql.raw(toSqlLiteral(KnowledgeSyncMode.Scheduled));
const daily = sql.raw(toSqlLiteral(KnowledgeSyncInterval.Daily));
const weekly = sql.raw(toSqlLiteral(KnowledgeSyncInterval.Weekly));

export const sources = knowledgeSchema
  .table(
    'sources',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      connectionId: uuid('connection_id'),
      kind: knowledgeSourceKindEnum('kind').notNull(),
      title: text('title').notNull(),
      status: knowledgeSourceStatusEnum('status').notNull(),
      syncMode: knowledgeSyncModeEnum('sync_mode').notNull(),
      syncInterval: knowledgeSyncIntervalEnum('sync_interval'),
      syncTime: time('sync_time'),
      syncWeekday: smallint('sync_weekday'),
      timezone: text('timezone'),
      nextSyncAt: timestamp('next_sync_at', { withTimezone: true }),
      lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
      lastErrorCode: text('last_error_code'),
      lastErrorMessage: text('last_error_message'),
      documentCount: integer('document_count').notNull().default(0),
      chunkCount: integer('chunk_count').notNull().default(0),
      createdByUserId: uuid('created_by_user_id').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: 'sources_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'sources_workspace_id_connection_id_connections_fk',
        columns: [table.workspaceId, table.connectionId],
        foreignColumns: [connections.workspaceId, connections.id],
      }).onDelete('restrict'),
      unique('sources_workspace_id_id_key').on(table.workspaceId, table.id),
      check(
        'sources_upload_manual',
        sql`${table.kind} <> ${upload} OR (${table.connectionId} is null and ${table.syncMode} = ${manual} and ${table.syncInterval} is null and ${table.nextSyncAt} is null)`,
      ),
      check(
        'sources_google_has_connection',
        sql`${table.kind} <> ${googleDocs} OR ${table.connectionId} is not null`,
      ),
      check(
        'sources_scheduled_has_schedule',
        sql`${table.syncMode} <> ${scheduled} OR (${table.syncInterval} is not null and ${table.nextSyncAt} is not null and ${table.timezone} is not null)`,
      ),
      check(
        'sources_weekly_has_time',
        sql`${table.syncInterval} is distinct from ${weekly} OR (${table.syncWeekday} between 1 and 7 and ${table.syncTime} is not null)`,
      ),
      check(
        'sources_daily_has_time',
        sql`${table.syncInterval} is distinct from ${daily} OR ${table.syncTime} is not null`,
      ),
      check(
        'sources_not_scheduled_has_no_schedule',
        sql`${table.syncMode} = ${scheduled} OR (${table.syncInterval} is null and ${table.syncTime} is null and ${table.syncWeekday} is null and ${table.timezone} is null and ${table.nextSyncAt} is null)`,
      ),
      index('sources_workspace_id_kb_id_idx').on(table.workspaceId, table.kbId),
      index('sources_workspace_id_connection_id_idx')
        .on(table.workspaceId, table.connectionId)
        .where(isNotNull(table.connectionId)),
      index('sources_workspace_id_next_sync_at_idx')
        .on(table.workspaceId, table.nextSyncAt)
        .where(sql`${table.deletedAt} is null and ${table.syncMode} = ${scheduled}`),
      index('sources_created_by_user_id_idx')
        .on(table.createdByUserId)
        .where(isNotNull(table.createdByUserId)),
      tenantIsolationPolicy('sources'),
    ],
  )
  .enableRLS();
