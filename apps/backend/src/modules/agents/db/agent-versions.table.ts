import type { FlowDocument } from '@agent-ic/flow';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  AgentVersionKind,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { agents, agentsSchema } from '@/modules/agents/db/agents.table';
import { toSqlLiteral } from '@/platform/database/helpers/tenant-sql.helpers';
import {
  tenantIsolationPolicy,
  workspaceIdColumn,
} from '@/platform/database/helpers/tenant-table.helpers';

export const agentVersionKindEnum = agentsSchema.enum('agent_version_kind', [
  AgentVersionKind.Draft,
  AgentVersionKind.Published,
  AgentVersionKind.Snapshot,
]);

export const agentVersions = agentsSchema
  .table(
    'agent_versions',
    {
      id: uuid('id').primaryKey(),
      workspaceId: workspaceIdColumn(),
      agentId: uuid('agent_id')
        .notNull()
        .references((): AnyPgColumn => agents.id, { onDelete: 'cascade' }),
      kind: agentVersionKindEnum('kind').notNull(),
      number: integer('number'),
      flow: jsonb('flow').$type<FlowDocument>().notNull(),
      note: text('note'),
      authorId: uuid('author_id'),
      revision: integer('revision').notNull().default(DRAFT_INITIAL_REVISION),
      baseVersionId: uuid('base_version_id').references((): AnyPgColumn => agentVersions.id, {
        onDelete: 'set null',
      }),
      publishedAt: timestamp('published_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
    },
    (table) => [
      check(
        'agent_versions_number_only_when_published',
        sql`(${table.kind} = ${sql.raw(toSqlLiteral(AgentVersionKind.Published))}) = (${table.number} is not null)`,
      ),
      uniqueIndex('agent_versions_agent_id_number_key').on(table.agentId, table.number),
      uniqueIndex('agent_versions_one_draft_key')
        .on(table.agentId)
        .where(sql`${table.kind} = ${sql.raw(toSqlLiteral(AgentVersionKind.Draft))}`),
      index('agent_versions_workspace_id_agent_id_idx').on(table.workspaceId, table.agentId),
      tenantIsolationPolicy('agent_versions'),
    ],
  )
  .enableRLS();
