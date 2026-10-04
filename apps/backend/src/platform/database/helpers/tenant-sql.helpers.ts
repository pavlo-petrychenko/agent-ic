import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { SQL_ESCAPED_QUOTE, SQL_QUOTE } from '@/platform/database/constants/sql.constants';
import {
  WORKSPACE_ID_COLUMN,
  WORKSPACE_SETTING,
  WORKSPACE_SETTING_IS_LOCAL,
} from '@/platform/database/constants/tenant.constants';

const toSqlLiteral = (value: string): string =>
  `${SQL_QUOTE}${value.replaceAll(SQL_QUOTE, SQL_ESCAPED_QUOTE)}${SQL_QUOTE}`;

export const currentWorkspaceId = (): SQL =>
  sql`nullif(current_setting(${sql.raw(toSqlLiteral(WORKSPACE_SETTING))}, true), '')::uuid`;

export const belongsToCurrentWorkspace = (): SQL =>
  sql`${sql.identifier(WORKSPACE_ID_COLUMN)} = ${currentWorkspaceId()}`;

export const setWorkspaceStatement = (workspaceId: string): SQL =>
  sql`select set_config(${WORKSPACE_SETTING}, ${workspaceId}, ${WORKSPACE_SETTING_IS_LOCAL})`;
