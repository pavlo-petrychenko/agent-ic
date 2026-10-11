import { sql } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { PROMPTS_SCHEMA } from '@/modules/prompts/constants/prompt.constants';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const promptsSchema = moduleSchema(PROMPTS_SCHEMA);

export const promptFolders = promptsSchema
  .table(
    'prompt_folders',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      name: text('name').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      uniqueIndex('prompt_folders_workspace_id_lower_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(sql`${table.deletedAt} is null`),
      index('prompt_folders_workspace_id_name_idx').on(table.workspaceId, table.name),
      tenantIsolationPolicy('prompt_folders'),
    ],
  )
  .enableRLS();
