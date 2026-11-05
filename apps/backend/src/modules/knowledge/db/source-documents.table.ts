import { foreignKey, index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { documents } from '@/modules/knowledge/db/documents.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import { sources } from '@/modules/knowledge/db/sources.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const sourceDocuments = knowledgeSchema
  .table(
    'source_documents',
    {
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      sourceId: uuid('source_id').notNull(),
      documentId: uuid('document_id').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      primaryKey({
        name: 'source_documents_source_id_document_id_key',
        columns: [table.sourceId, table.documentId],
      }),
      foreignKey({
        name: 'source_documents_workspace_id_source_id_sources_fk',
        columns: [table.workspaceId, table.sourceId],
        foreignColumns: [sources.workspaceId, sources.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'source_documents_workspace_id_document_id_documents_fk',
        columns: [table.workspaceId, table.documentId],
        foreignColumns: [documents.workspaceId, documents.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'source_documents_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      index('source_documents_workspace_id_source_id_idx').on(table.workspaceId, table.sourceId),
      index('source_documents_workspace_id_document_id_idx').on(
        table.workspaceId,
        table.documentId,
      ),
      index('source_documents_workspace_id_kb_id_idx').on(table.workspaceId, table.kbId),
      tenantIsolationPolicy('source_documents'),
    ],
  )
  .enableRLS();
