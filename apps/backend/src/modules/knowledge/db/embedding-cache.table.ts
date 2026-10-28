import { sql } from 'drizzle-orm';
import { check, halfvec, integer, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  KNOWLEDGE_MIN_EMBEDDING_DIMENSIONS,
} from '@/modules/knowledge/constants/knowledge.constants';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const embeddingCache = knowledgeSchema
  .table(
    'embedding_cache',
    {
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      model: text('model').notNull(),
      dimensions: integer('dimensions').notNull(),
      textHash: text('text_hash').notNull(),
      embedding: halfvec('embedding', { dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS }).notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      primaryKey({
        name: 'embedding_cache_workspace_id_model_dimensions_text_hash_key',
        columns: [table.workspaceId, table.model, table.dimensions, table.textHash],
      }),
      check(
        'embedding_cache_dimensions_positive',
        sql`${table.dimensions} >= ${sql.raw(String(KNOWLEDGE_MIN_EMBEDDING_DIMENSIONS))}`,
      ),
      tenantIsolationPolicy('embedding_cache'),
    ],
  )
  .enableRLS();
