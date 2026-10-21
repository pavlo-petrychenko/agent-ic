import type { ResourcePermissions } from '@agent-ic/contracts';
import { useTranslation } from 'react-i18next';
import {
  ROLE_ACTION_LABEL_KEYS,
  ROLE_MATRIX_ACTIONS,
  ROLE_RESOURCE_DEFINITIONS,
} from '@/features/settings/constants/roles.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { RoleMatrixContent, RoleMatrixRow } from '@/features/settings/typedefs/role.typedefs';

export function useRoleMatrix(permissions: ResourcePermissions | null): RoleMatrixContent {
  const { t } = useTranslation(SETTINGS_NAMESPACE);

  const columns = ROLE_MATRIX_ACTIONS.map((action) => ({
    id: action,
    label: t(ROLE_ACTION_LABEL_KEYS[action]),
    action,
  }));

  const rows: readonly RoleMatrixRow[] = ROLE_RESOURCE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: t(definition.labelKey),
    note: definition.noteKey === null ? null : t(definition.noteKey),
    actions: definition.actions,
    granted: permissions === null ? [] : (permissions[definition.resource] ?? []),
  }));

  return { resourceLabel: t('roles.matrix.resource'), columns, rows };
}
