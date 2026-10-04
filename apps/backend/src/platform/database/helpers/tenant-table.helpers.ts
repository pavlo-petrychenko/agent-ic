import { pgPolicy, pgSchema, uuid } from 'drizzle-orm/pg-core';
import {
  TENANT_POLICY_COMMAND,
  TENANT_POLICY_MODE,
  TENANT_POLICY_SUFFIX,
  WORKSPACE_ID_COLUMN,
} from '@/platform/database/constants/tenant.constants';
import { belongsToCurrentWorkspace } from '@/platform/database/helpers/tenant-sql.helpers';

export const moduleSchema = <TName extends string>(name: TName) => pgSchema(name);

export const workspaceIdColumn = () => uuid(WORKSPACE_ID_COLUMN).notNull();

export const tenantIsolationPolicy = (tableName: string) =>
  pgPolicy(`${tableName}${TENANT_POLICY_SUFFIX}`, {
    as: TENANT_POLICY_MODE,
    for: TENANT_POLICY_COMMAND,
    using: belongsToCurrentWorkspace(),
    withCheck: belongsToCurrentWorkspace(),
  });
