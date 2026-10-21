import { sql } from 'drizzle-orm';
import { index, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { promptsSchema } from '@/modules/prompts/db/prompts.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const prompts = promptsSchema
  .table(
    'prompts',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      name: text('name').notNull(),
      folderId: uuid('folder_id')
        .notNull()
        .references((): AnyPgColumn => promptFolders.id, { onDelete: 'restrict' }),
      createdByUserId: uuid('created_by_user_id'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .$onUpdateFn(() => new Date()),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      unique('prompts_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('prompts_workspace_id_lower_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(sql`${table.deletedAt} is null`),
      index('prompts_workspace_id_folder_id_idx').on(table.workspaceId, table.folderId),
      tenantIsolationPolicy('prompts'),
    ],
  )
  .enableRLS();
