import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  halfvec,
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  KNOWLEDGE_MIN_EMBEDDING_DIMENSIONS,
  KNOWLEDGE_MIN_GENERATION,
  KNOWLEDGE_MIN_ORDINAL,
  KNOWLEDGE_MIN_TOKEN_COUNT,
} from '@/modules/knowledge/constants/knowledge.constants';
import { documents } from '@/modules/knowledge/db/documents.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import { sections } from '@/modules/knowledge/db/sections.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const chunks = knowledgeSchema
  .table(
    'chunks',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      documentId: uuid('document_id').notNull(),
      sectionId: uuid('section_id').notNull(),
      generation: integer('generation').notNull(),
      ordinal: integer('ordinal').notNull(),
      content: text('content').notNull(),
      indexText: text('index_text').notNull(),
      contentHash: text('content_hash').notNull(),
      tokenCount: integer('token_count').notNull(),
      embedding: halfvec('embedding', { dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS }).notNull(),
      embeddingModel: text('embedding_model').notNull(),
      embeddingDimensions: integer('embedding_dimensions').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'chunks_workspace_id_document_id_documents_fk',
        columns: [table.workspaceId, table.documentId],
        foreignColumns: [documents.workspaceId, documents.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'chunks_workspace_id_section_id_sections_fk',
        columns: [table.workspaceId, table.sectionId],
        foreignColumns: [sections.workspaceId, sections.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'chunks_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      unique('chunks_workspace_id_id_key').on(table.workspaceId, table.id),
      unique('chunks_document_id_generation_ordinal_key').on(
        table.documentId,
        table.generation,
        table.ordinal,
      ),
      check(
        'chunks_generation_nonnegative',
        sql`${table.generation} >= ${sql.raw(String(KNOWLEDGE_MIN_GENERATION))}`,
      ),
      check(
        'chunks_ordinal_nonnegative',
        sql`${table.ordinal} >= ${sql.raw(String(KNOWLEDGE_MIN_ORDINAL))}`,
      ),
      check(
        'chunks_token_count_nonnegative',
        sql`${table.tokenCount} >= ${sql.raw(String(KNOWLEDGE_MIN_TOKEN_COUNT))}`,
      ),
      check(
        'chunks_embedding_dimensions_positive',
        sql`${table.embeddingDimensions} >= ${sql.raw(String(KNOWLEDGE_MIN_EMBEDDING_DIMENSIONS))}`,
      ),
      index('chunks_workspace_id_document_id_idx').on(table.workspaceId, table.documentId),
      index('chunks_workspace_id_section_id_idx').on(table.workspaceId, table.sectionId),
      index('chunks_workspace_id_kb_id_generation_idx').on(
        table.workspaceId,
        table.kbId,
        table.generation,
      ),
      index('chunks_section_id_ordinal_idx').on(table.sectionId, table.ordinal),
      index('chunks_workspace_id_kb_id_content_hash_idx').on(
        table.workspaceId,
        table.kbId,
        table.contentHash,
      ),
      tenantIsolationPolicy('chunks'),
    ],
  )
  .enableRLS();
