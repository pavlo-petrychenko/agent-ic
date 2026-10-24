import { LlmKeyVendor } from '@agent-ic/contracts';
import { sql } from 'drizzle-orm';
import { boolean, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { LLM_KEYS_SCHEMA } from '@/modules/llm-keys/constants/llm-key.constants';
import { toSqlLiteral } from '@/platform/database/helpers/tenant-sql.helpers';
import {
  moduleSchema,
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const llmKeysSchema = moduleSchema(LLM_KEYS_SCHEMA);

export const llmKeys = llmKeysSchema
  .table(
    'llm_keys',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      vendor: text('vendor').$type<LlmKeyVendor>().notNull(),
      name: text('name').notNull(),
      baseUrl: text('base_url'),
      sealedKey: text('sealed_key').notNull(),
      keyLast4: text('key_last4').notNull(),
      fallbackToPlatform: boolean('fallback_to_platform').notNull().default(false),
      createdBy: uuid('created_by').notNull(),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      unique('llm_keys_workspace_id_id_key').on(table.workspaceId, table.id),
      uniqueIndex('llm_keys_workspace_id_vendor_key')
        .on(table.workspaceId, table.vendor)
        .where(sql`${table.vendor} <> ${sql.raw(toSqlLiteral(LlmKeyVendor.Custom))}`),
      uniqueIndex('llm_keys_workspace_id_lower_name_key').on(
        table.workspaceId,
        sql`lower(${table.name})`,
      ),
      tenantIsolationPolicy('llm_keys'),
    ],
  )
  .enableRLS();
