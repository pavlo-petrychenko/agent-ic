import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import {
  KNOWLEDGE_MAX_HEADING_LEVEL,
  KNOWLEDGE_MIN_GENERATION,
  KNOWLEDGE_MIN_HEADING_LEVEL,
  KNOWLEDGE_MIN_ORDINAL,
  KNOWLEDGE_MIN_TOKEN_COUNT,
} from '@/modules/knowledge/constants/knowledge.constants';
import { documents } from '@/modules/knowledge/db/documents.table';
import { knowledgeBases } from '@/modules/knowledge/db/knowledge-bases.table';
import { knowledgeSchema } from '@/modules/knowledge/db/knowledge.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const sections = knowledgeSchema
  .table(
    'sections',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      kbId: uuid('kb_id').notNull(),
      documentId: uuid('document_id').notNull(),
      generation: integer('generation').notNull(),
      ordinal: integer('ordinal').notNull(),
      level: smallint('level').notNull(),
      path: text('path').notNull(),
      heading: text('heading'),
      tokenCount: integer('token_count').notNull(),
      contentHash: text('content_hash').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'sections_workspace_id_document_id_documents_fk',
        columns: [table.workspaceId, table.documentId],
        foreignColumns: [documents.workspaceId, documents.id],
      }).onDelete('cascade'),
      foreignKey({
        name: 'sections_workspace_id_kb_id_knowledge_bases_fk',
        columns: [table.workspaceId, table.kbId],
        foreignColumns: [knowledgeBases.workspaceId, knowledgeBases.id],
      }).onDelete('cascade'),
      unique('sections_workspace_id_id_key').on(table.workspaceId, table.id),
      unique('sections_document_id_generation_ordinal_key').on(
        table.documentId,
        table.generation,
        table.ordinal,
      ),
      check(
        'sections_level_range',
        sql`${table.level} between ${sql.raw(String(KNOWLEDGE_MIN_HEADING_LEVEL))} and ${sql.raw(String(KNOWLEDGE_MAX_HEADING_LEVEL))}`,
      ),
      check(
        'sections_generation_nonnegative',
        sql`${table.generation} >= ${sql.raw(String(KNOWLEDGE_MIN_GENERATION))}`,
      ),
      check(
        'sections_ordinal_nonnegative',
        sql`${table.ordinal} >= ${sql.raw(String(KNOWLEDGE_MIN_ORDINAL))}`,
      ),
      check(
        'sections_token_count_nonnegative',
        sql`${table.tokenCount} >= ${sql.raw(String(KNOWLEDGE_MIN_TOKEN_COUNT))}`,
      ),
      index('sections_workspace_id_document_id_idx').on(table.workspaceId, table.documentId),
      index('sections_workspace_id_kb_id_idx').on(table.workspaceId, table.kbId),
      tenantIsolationPolicy('sections'),
    ],
  )
  .enableRLS();
