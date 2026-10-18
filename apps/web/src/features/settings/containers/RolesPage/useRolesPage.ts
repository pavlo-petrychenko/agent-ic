import { WorkspaceRole } from '@agent-ic/contracts';
import type { PermissionAction, ResourcePermissions } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoles } from '@/features/settings/communication/hooks/useRoles';
import { useTeamMembers } from '@/features/settings/communication/hooks/useTeamMembers';
import { useUpdateRolePermissions } from '@/features/settings/communication/hooks/useUpdateRolePermissions';
import { ROLE_RESOURCE_DEFINITIONS } from '@/features/settings/constants/roles.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { useCreateRoleDialog } from '@/features/settings/containers/CreateRoleDialog';
import type { UseRolesPageResult } from '@/features/settings/containers/RolesPage/RolesPage.typedefs';
import { useRoleMatrix } from '@/features/settings/logic/hooks/useRoleMatrix';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

interface RoleDraft {
  readonly roleId: string;
  readonly permissions: ResourcePermissions;
}

export function useRolesPage(): UseRolesPageResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();

  const { roles } = useRoles();
  const { members } = useTeamMembers();
  const updatePermissions = useUpdateRolePermissions();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoleDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const { openDialog, ...createRoleDialog } = useCreateRoleDialog({
    roles,
    onCreated: (role) => {
      setSelectedId(role.id);
      setDraft({ roleId: role.id, permissions: role.permissions });
    },
  });

  const selected =
    roles.find((role) => role.id === selectedId) ??
    roles.find((role) => role.key === WorkspaceRole.Operator) ??
    roles[0] ??
    null;

  const permissions =
    draft !== null && selected !== null && draft.roleId === selected.id
      ? draft.permissions
      : (selected?.permissions ?? null);

  const locked = selected !== null && selected.isSystem && selected.key === WorkspaceRole.Owner;

  const titleOf = (role: AppRole): string =>
    role.isSystem ? tCommon(`roles.name.${role.key}`) : (role.name ?? '');

  const descriptionOf = (role: AppRole): string =>
    role.isSystem ? t(`roles.description.${role.key}`) : t('roles.customDescription');

  const roleItems = roles.map((role) => ({
    id: role.id,
    title: titleOf(role),
    description: `${descriptionOf(role)} · ${t('roles.members', { count: role.memberCount })}`,
  }));

  const memberNames =
    selected === null
      ? []
      : members.filter((member) => member.roleId === selected.id).map((member) => member.name);

  const matrix = useRoleMatrix(permissions);

  const onSelect = (id: string) => {
    const role = roles.find((entry) => entry.id === id);
    if (role === undefined) {
      return;
    }
    setSelectedId(id);
    setDraft({ roleId: id, permissions: role.permissions });
  };

  const onToggle = (rowId: string, action: PermissionAction, checked: boolean) => {
    const definition = ROLE_RESOURCE_DEFINITIONS.find((entry) => entry.id === rowId);
    if (definition === undefined || locked) {
      return;
    }
    setDraft((current) => {
      const base =
        current !== null && current.roleId === selected?.id
          ? current.permissions
          : (selected?.permissions ?? null);
      if (base === null || selected === null) {
        return current;
      }
      const actions = base[definition.resource];
      const next = checked
        ? [...new Set([...actions, action])]
        : actions.filter((entry) => entry !== action);
      return { roleId: selected.id, permissions: { ...base, [definition.resource]: next } };
    });
  };

  const save = async () => {
    if (selected === null || permissions === null) {
      return;
    }
    setSaving(true);
    try {
      await updatePermissions(selected.id, permissions);
      showToast({ message: t('roles.saved'), tone: ToastTone.Ok });
    } catch (caught) {
      showToast({ message: errorMessage(toAppError(caught)), tone: ToastTone.Err });
    } finally {
      setSaving(false);
    }
  };

  const onNewRole = () => openDialog({ name: '', baseRole: WorkspaceRole.Operator });

  const onDuplicate = () => {
    if (selected === null || locked) {
      return;
    }
    openDialog({ name: `${titleOf(selected)} ${t('roles.copySuffix')}`, baseRole: selected.key });
  };

  return {
    roles: roleItems,
    selectedId: selected?.id ?? '',
    selectedTitle: selected === null ? null : titleOf(selected),
    memberCount: selected?.memberCount ?? 0,
    memberNames,
    matrix,
    locked,
    saving,
    hint: locked ? t('roles.locked') : t('roles.hint'),
    createRoleDialog,
    onSelect,
    onToggle,
    onSave: () => void save(),
    onNewRole,
    onDuplicate,
  };
}
