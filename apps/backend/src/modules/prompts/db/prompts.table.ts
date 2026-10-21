import { isNotNull, sql } from 'drizzle-orm';
import { foreignKey, index, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
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
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      name: text('name').notNull(),
      folderId: uuid('folder_id').notNull(),
      createdByUserId: uuid('created_by_user_id').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .$onUpdateFn(() => new Date()),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: 'prompts_workspace_id_folder_id_prompt_folders_fk',
        columns: [table.workspaceId, table.folderId],
        foreignColumns: [promptFolders.workspaceId, promptFolders.id],
      }).onDelete('restrict'),
      unique('prompts_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('prompts_workspace_id_lower_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(sql`${table.deletedAt} is null`),
      index('prompts_workspace_id_folder_id_idx').on(table.workspaceId, table.folderId),
      index('prompts_created_by_user_id_idx')
        .on(table.createdByUserId)
        .where(isNotNull(table.createdByUserId)),
      tenantIsolationPolicy('prompts'),
    ],
  )
  .enableRLS();
