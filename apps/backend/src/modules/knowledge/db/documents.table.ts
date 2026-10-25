import { sql } from 'drizzle-orm';
import {
  bigint,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import {
  knowledgeDocumentStatusEnum,
  knowledgeSchema,
  knowledgeSummarySourceEnum,
} from '@/modules/knowledge/db/knowledge.pg-schema';
import { sources } from '@/modules/knowledge/db/sources.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const documents = knowledgeSchema
  .table(
    'documents',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      sourceId: uuid('source_id').notNull(),
      externalId: text('external_id'),
      externalResourceKey: text('external_resource_key'),
      providerVersion: text('provider_version'),
      providerModifiedAt: timestamp('provider_modified_at', { withTimezone: true }),
      title: text('title').notNull(),
      mimeType: text('mime_type').notNull(),
      sourceUrl: text('source_url'),
      sizeBytes: bigint('size_bytes', { mode: 'number' }),
      originalStorageKey: text('original_storage_key'),
      contentStorageKey: text('content_storage_key'),
      contentHash: text('content_hash'),
      summary: text('summary'),
      summarySource: knowledgeSummarySourceEnum('summary_source'),
      summaryUpdatedAt: timestamp('summary_updated_at', { withTimezone: true }),
      tokenCount: integer('token_count').notNull().default(0),
      chunkCount: integer('chunk_count').notNull().default(0),
      status: knowledgeDocumentStatusEnum('status').notNull(),
      activeGeneration: integer('active_generation').notNull().default(0),
      lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
      errorCode: text('error_code'),
      errorMessage: text('error_message'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: 'documents_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'documents_workspace_id_source_id_sources_fk',
        columns: [table.workspaceId, table.sourceId],
        foreignColumns: [sources.workspaceId, sources.id],
      }).onDelete('cascade'),
      unique('documents_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('documents_workspace_id_source_id_external_id_key')
        .on(table.workspaceId, table.sourceId, table.externalId)
        .where(sql`${table.externalId} is not null and ${table.deletedAt} is null`),
      uniqueIndex('documents_workspace_id_source_id_upload_key')
        .on(table.workspaceId, table.sourceId)
        .where(sql`${table.externalId} is null and ${table.deletedAt} is null`),
      index('documents_workspace_id_kb_id_status_idx').on(
        table.workspaceId,
        table.kbId,
        table.status,
      ),
      index('documents_workspace_id_source_id_idx').on(table.workspaceId, table.sourceId),
      index('documents_title_trgm_idx').using('gin', sql`${table.title} gin_trgm_ops`),
      tenantIsolationPolicy('documents'),
    ],
  )
  .enableRLS();
