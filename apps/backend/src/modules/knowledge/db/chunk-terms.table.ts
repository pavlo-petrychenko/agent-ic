import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { KNOWLEDGE_MIN_TERM_FREQUENCY } from '@/modules/knowledge/constants/knowledge.constants';
import { chunks } from '@/modules/knowledge/db/chunks.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const chunkTerms = knowledgeSchema
  .table(
    'chunk_terms',
    {
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      chunkId: uuid('chunk_id').notNull(),
      term: text('term').notNull(),
      frequency: integer('frequency').notNull(),
    },
    (table) => [
      primaryKey({ name: 'chunk_terms_chunk_id_term_key', columns: [table.chunkId, table.term] }),
      foreignKey({
        name: 'chunk_terms_workspace_id_chunk_id_chunks_fk',
        columns: [table.workspaceId, table.chunkId],
        foreignColumns: [chunks.workspaceId, chunks.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'chunk_terms_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      check(
        'chunk_terms_frequency_positive',
        sql`${table.frequency} >= ${sql.raw(String(KNOWLEDGE_MIN_TERM_FREQUENCY))}`,
      ),
      index('chunk_terms_workspace_id_chunk_id_idx').on(table.workspaceId, table.chunkId),
      index('chunk_terms_workspace_id_kb_id_term_idx').on(
        table.workspaceId,
        table.kbId,
        table.term,
      ),
      tenantIsolationPolicy('chunk_terms'),
    ],
  )
  .enableRLS();
