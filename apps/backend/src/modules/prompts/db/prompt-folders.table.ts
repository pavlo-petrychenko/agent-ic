import { sql } from 'drizzle-orm';
import { index, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { promptsSchema } from '@/modules/prompts/db/prompts.pg-schema';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const promptFolders = promptsSchema
  .table(
    'prompt_folders',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      name: text('name').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .$onUpdateFn(() => new Date()),
      deletedAt: timestamp('deleted_at', { withTimezone: true }),
    },
    (table) => [
      unique('prompt_folders_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('prompt_folders_workspace_id_lower_name_key')
        .on(table.workspaceId, sql`lower(${table.name})`)
        .where(sql`${table.deletedAt} is null`),
      index('prompt_folders_workspace_id_name_idx').on(table.workspaceId, table.name),
      tenantIsolationPolicy('prompt_folders'),
    ],
  )
  .enableRLS();
