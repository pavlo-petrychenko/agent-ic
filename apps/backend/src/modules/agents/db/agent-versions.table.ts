import type { FlowDocument } from '@agent-ic/flow';
import { isNotNull, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  AUTO_CLOSE_MINUTES_PATH,
  AgentVersionKind,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { agentVersionKindEnum, agentsSchema } from '@/modules/agents/db/agents.pg-schema';
import { agents } from '@/modules/agents/db/agents.table';
import { users } from '@/modules/identity/db/users.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { toSqlLiteral } from '@/platform/database/helpers/tenant-sql.helpers';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const agentVersions = agentsSchema
  .table(
    'agent_versions',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn().references((): AnyPgColumn => workspaces.id, {
        onDelete: 'cascade',
      }),
      agentId: uuid('agent_id').notNull(),
      kind: agentVersionKindEnum('kind').notNull(),
      number: integer('number'),
      flow: jsonb('flow').$type<FlowDocument>().notNull(),
      note: text('note'),
      authorId: uuid('author_id').references((): AnyPgColumn => users.id, {
        onDelete: 'set null',
      }),
      revision: integer('revision').notNull().default(DRAFT_INITIAL_REVISION),
      baseVersionId: uuid('base_version_id').references((): AnyPgColumn => agentVersions.id, {
        onDelete: 'set null',
      }),
      publishedAt: timestamp('published_at', { withTimezone: true }),
      autoCloseMinutes: integer('auto_close_minutes').generatedAlwaysAs(
        sql`((flow #>> ${sql.raw(toSqlLiteral(AUTO_CLOSE_MINUTES_PATH))})::integer)`,
      ),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      foreignKey({
        name: 'agent_versions_workspace_id_agent_id_agents_fk',
        columns: [table.workspaceId, table.agentId],
        foreignColumns: [agents.workspaceId, agents.id],
      }).onDelete('cascade'),
      unique('agent_versions_workspace_id_id_key').on(table.workspaceId, table.id),
      check(
        'agent_versions_number_only_when_published',
        sql`(${table.kind} = ${sql.raw(toSqlLiteral(AgentVersionKind.Published))}) = (${table.number} is not null)`,
      ),
      uniqueIndex('agent_versions_agent_id_number_key').on(table.agentId, table.number),
      uniqueIndex('agent_versions_one_draft_key')
        .on(table.agentId)
        .where(sql`${table.kind} = ${sql.raw(toSqlLiteral(AgentVersionKind.Draft))}`),
      index('agent_versions_workspace_id_agent_id_idx').on(table.workspaceId, table.agentId),
      index('agent_versions_author_id_idx').on(table.authorId).where(isNotNull(table.authorId)),
      index('agent_versions_base_version_id_idx')
        .on(table.baseVersionId)
        .where(isNotNull(table.baseVersionId)),
      index('agent_versions_auto_close_idx')
        .on(table.agentId)
        .where(isNotNull(table.autoCloseMinutes)),
      tenantIsolationPolicy('agent_versions'),
    ],
  )
  .enableRLS();
