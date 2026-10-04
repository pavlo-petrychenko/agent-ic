export enum TenantSchemaProblem {
  MissingWorkspaceId = 'missing_workspace_id',
  RlsDisabled = 'rls_disabled',
  RlsNotForced = 'rls_not_forced',
  MissingPolicy = 'missing_policy',
}

export const INSPECTED_TABLE_KINDS: readonly string[] = ['r', 'p'];
export const TENANT_EXEMPT_TABLES: readonly string[] = [];
export const QUALIFIED_NAME_SEPARATOR = '.';
