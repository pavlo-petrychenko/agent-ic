import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import { isNotNull, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { FIRST_PROMPT_VERSION_NUMBER } from '@/modules/prompts/constants/prompt.constants';
import { promptsSchema } from '@/modules/prompts/db/prompts.pg-schema';
import { prompts } from '@/modules/prompts/db/prompts.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const promptVersions = promptsSchema
  .table(
    'prompt_versions',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      promptId: uuid('prompt_id').notNull(),
      number: integer('number').notNull(),
      text: text('text').notNull(),
      note: text('note'),
      authorId: uuid('author_id').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: 'prompt_versions_workspace_id_prompt_id_prompts_fk',
        columns: [table.workspaceId, table.promptId],
        foreignColumns: [prompts.workspaceId, prompts.id],
      }).onDelete('cascade'),
      check(
        'prompt_versions_number_positive',
        sql`${table.number} >= ${sql.raw(String(FIRST_PROMPT_VERSION_NUMBER))}`,
      ),
      check(
        'prompt_versions_text_max_length',
        sql`char_length(${table.text}) <= ${sql.raw(String(MAX_TEMPLATE_LENGTH))}`,
      ),
      uniqueIndex('prompt_versions_prompt_id_number_key').on(table.promptId, table.number),
      index('prompt_versions_workspace_id_prompt_id_number_idx').on(
        table.workspaceId,
        table.promptId,
        table.number,
      ),
      index('prompt_versions_author_id_idx').on(table.authorId).where(isNotNull(table.authorId)),
      tenantIsolationPolicy('prompt_versions'),
    ],
  )
  .enableRLS();
