import { isNotNull, isNull, sql } from 'drizzle-orm';
import { index, integer, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const knowledgeBases = knowledgeSchema
  .table(
    'knowledge_bases',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      name: text('name').notNull(),
      description: text('description'),
      toolName: text('tool_name').notNull(),
      toolDescription: text('tool_description'),
      embeddingModel: text('embedding_model').notNull(),
      embeddingDimensions: integer('embedding_dimensions').notNull(),
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
      unique('knowledge_bases_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('knowledge_bases_workspace_id_lower_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(isNull(table.deletedAt)),
      uniqueIndex('knowledge_bases_workspace_id_lower_tool_name_key')
        .on(table.workspaceId, sql`lower(${table.toolName})`)
        .where(isNull(table.deletedAt)),
      index('knowledge_bases_created_by_user_id_idx')
        .on(table.createdByUserId)
        .where(isNotNull(table.createdByUserId)),
      tenantIsolationPolicy('knowledge_bases'),
    ],
  )
  .enableRLS();
