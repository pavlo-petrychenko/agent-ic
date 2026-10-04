import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { pgPolicy, pgSchema, uuid } from 'drizzle-orm/pg-core';
import {
  SQL_ESCAPED_QUOTE,
  SQL_QUOTE,
  TENANT_POLICY_COMMAND,
  TENANT_POLICY_MODE,
  TENANT_POLICY_SUFFIX,
  WORKSPACE_ID_COLUMN,
  WORKSPACE_SETTING,
  WORKSPACE_SETTING_IS_LOCAL,
} from '@/platform/db/tenancy/tenancy.constants';

const toSqlLiteral = (value: string): string =>
  `${SQL_QUOTE}${value.replaceAll(SQL_QUOTE, SQL_ESCAPED_QUOTE)}${SQL_QUOTE}`;

export const moduleSchema = <TName extends string>(name: TName) => pgSchema(name);

export const workspaceIdColumn = () => uuid(WORKSPACE_ID_COLUMN).notNull();

export const currentWorkspaceId = (): SQL =>
  sql`nullif(current_setting(${sql.raw(toSqlLiteral(WORKSPACE_SETTING))}, true), '')::uuid`;

export const belongsToCurrentWorkspace = (): SQL =>
  sql`${sql.identifier(WORKSPACE_ID_COLUMN)} = ${currentWorkspaceId()}`;

export const tenantIsolationPolicy = (tableName: string) =>
  pgPolicy(`${tableName}${TENANT_POLICY_SUFFIX}`, {
    as: TENANT_POLICY_MODE,
    for: TENANT_POLICY_COMMAND,
    using: belongsToCurrentWorkspace(),
    withCheck: belongsToCurrentWorkspace(),
  });

export const setWorkspaceStatement = (workspaceId: string): SQL =>
  sql`select set_config(${WORKSPACE_SETTING}, ${workspaceId}, ${WORKSPACE_SETTING_IS_LOCAL})`;
