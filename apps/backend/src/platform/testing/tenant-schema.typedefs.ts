import type { TenantSchemaProblem } from '@/platform/testing/tenant-schema.constants';

export interface TenantTableRow extends Record<string, unknown> {
  readonly schemaName: string;
  readonly tableName: string;
  readonly rlsEnabled: boolean;
  readonly rlsForced: boolean;
  readonly hasWorkspaceId: boolean;
  readonly hasPolicy: boolean;
}

export interface TenantSchemaViolation {
  readonly table: string;
  readonly problems: readonly TenantSchemaProblem[];
}
