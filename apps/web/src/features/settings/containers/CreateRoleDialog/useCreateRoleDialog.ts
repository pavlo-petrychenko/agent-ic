import { INVITABLE_ROLES, WorkspaceRole } from '@agent-ic/contracts';
import type { PermissionAction, ResourcePermissions } from '@agent-ic/contracts';
import { useCallback, useMemo, useState } from 'react';
import { useCreateRole } from '@/features/settings/communication/hooks/useCreateRole';
import { ROLE_RESOURCE_DEFINITIONS } from '@/features/settings/constants/roles.constants';
import type {
  CreateRoleDialogDefaults,
  UseCreateRoleDialogOptions,
  UseCreateRoleDialogResult,
} from '@/features/settings/containers/CreateRoleDialog/CreateRoleDialog.typedefs';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { emptyResourcePermissions } from '@/shared/api/helpers/permission.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';

export function useCreateRoleDialog({
  roles,
  onCreated,
}: UseCreateRoleDialogOptions): UseCreateRoleDialogResult {
  const createRole = useCreateRole();
  const errorMessage = useErrorMessage();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseRole, setBaseRole] = useState<WorkspaceRole>(WorkspaceRole.Operator);
  const [permissions, setPermissions] = useState<ResourcePermissions>(() =>
    emptyResourcePermissions(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseRoles = useMemo(
    () => roles.filter((role) => role.isSystem && INVITABLE_ROLES.includes(role.key)),
    [roles],
  );

  const openDialog = useCallback(
    (defaults: CreateRoleDialogDefaults) => {
      const base = baseRoles.find((role) => role.key === defaults.baseRole);
      setName(defaults.name);
      setDescription('');
      setBaseRole(defaults.baseRole);
      setPermissions(base?.permissions ?? emptyResourcePermissions());
      setError(null);
      setOpen(true);
    },
    [baseRoles],
  );

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setError(null);
    }
  };

  const onBaseRoleChange = (role: AppRole) => {
    setBaseRole(role.key);
    setPermissions(role.permissions);
  };

  const onToggle = (rowId: string, action: PermissionAction, checked: boolean) => {
    const definition = ROLE_RESOURCE_DEFINITIONS.find((entry) => entry.id === rowId);
    if (definition === undefined) {
      return;
    }
    setPermissions((current) => {
      const actions = current[definition.resource];
      const next = checked
        ? [...new Set([...actions, action])]
        : actions.filter((entry) => entry !== action);
      return { ...current, [definition.resource]: next };
    });
  };

  const onSubmit = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const trimmedDescription = description.trim();
      const created = await createRole({
        name: trimmedName,
        baseRole,
        description: trimmedDescription === '' ? null : trimmedDescription,
        permissions,
      });
      if (created !== null) {
        onCreated(created);
      }
      setOpen(false);
    } catch (caught) {
      setError(errorMessage(toAppError(caught)));
    } finally {
      setBusy(false);
    }
  };

  return {
    open,
    busy,
    error,
    name,
    description,
    baseRole,
    baseRoles,
    permissions,
    onOpenChange,
    onNameChange: setName,
    onDescriptionChange: setDescription,
    onBaseRoleChange,
    onToggle,
    onSubmit: () => void onSubmit(),
    openDialog,
  };
}
