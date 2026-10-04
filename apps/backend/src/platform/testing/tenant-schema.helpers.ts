import {
  QUALIFIED_NAME_SEPARATOR,
  TenantSchemaProblem,
} from '@/platform/testing/tenant-schema.constants';
import type {
  TenantSchemaViolation,
  TenantTableRow,
} from '@/platform/testing/tenant-schema.typedefs';

export const qualifiedTableName = (row: TenantTableRow): string =>
  `${row.schemaName}${QUALIFIED_NAME_SEPARATOR}${row.tableName}`;

export const findTenantProblems = (row: TenantTableRow): TenantSchemaProblem[] => [
  ...(row.hasWorkspaceId ? [] : [TenantSchemaProblem.MissingWorkspaceId]),
  ...(row.rlsEnabled ? [] : [TenantSchemaProblem.RlsDisabled]),
  ...(row.rlsForced ? [] : [TenantSchemaProblem.RlsNotForced]),
  ...(row.hasPolicy ? [] : [TenantSchemaProblem.MissingPolicy]),
];

export const toViolation = (row: TenantTableRow): TenantSchemaViolation => ({
  table: qualifiedTableName(row),
  problems: findTenantProblems(row),
});
