import type { PermissionAction } from '@agent-ic/contracts';
import type { RoleMatrixColumn, RoleMatrixRow } from '@/features/settings/typedefs/role.typedefs';

export interface RoleMatrixProps {
  readonly resourceLabel: string;
  readonly columns: readonly RoleMatrixColumn[];
  readonly rows: readonly RoleMatrixRow[];
  readonly onToggle: (rowId: string, action: PermissionAction, checked: boolean) => void;
}
