import { isNotNull } from 'drizzle-orm';
import { foreignKey, index, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import {
  channelKindEnum,
  closeReasonEnum,
  conversationModeEnum,
  conversationStateEnum,
  conversationsSchema,
} from '@/modules/conversations/db/conversations.pg-schema';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { runs } from '@/modules/runs/db/runs.table';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const conversations = conversationsSchema
  .table(
    'conversations',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      agentId: uuid('agent_id').notNull(),
      mode: conversationModeEnum('mode').notNull(),
      channelKind: channelKindEnum('channel_kind').notNull(),
      channelId: text('channel_id'),
      endUserExternalId: text('end_user_external_id').notNull(),
      endUserName: text('end_user_name'),
      endUserLanguage: text('end_user_language'),
      state: conversationStateEnum('state').notNull(),
      handledBy: uuid('handled_by').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      activeRunId: uuid('active_run_id').references((): AnyPgColumn => runs.id, {
        onDelete: 'set null',
      }),
      simulationVersionId: uuid('simulation_version_id').references(
        (): AnyPgColumn => agentVersions.id,
        { onDelete: 'set null' },
      ),
      awaySentAt: timestamp('away_sent_at', { withTimezone: true }),
      lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
      closedAt: timestamp('closed_at', { withTimezone: true }),
      closeReason: closeReasonEnum('close_reason'),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'conversations_workspace_id_agent_id_agents_fk',
        columns: [table.workspaceId, table.agentId],
        foreignColumns: [agents.workspaceId, agents.id],
      }).onDelete('no action'),
      unique('conversations_workspace_id_id_key').on(table.workspaceId, table.id),
      index('conversations_end_user_idx').on(
        table.workspaceId,
        table.agentId,
        table.endUserExternalId,
        table.channelKind,
        table.mode,
      ),
      index('conversations_handled_by_idx').on(table.handledBy).where(isNotNull(table.handledBy)),
      index('conversations_active_run_id_idx')
        .on(table.activeRunId)
        .where(isNotNull(table.activeRunId)),
      index('conversations_simulation_version_id_idx')
        .on(table.simulationVersionId)
        .where(isNotNull(table.simulationVersionId)),
      tenantIsolationPolicy('conversations'),
    ],
  )
  .enableRLS();
