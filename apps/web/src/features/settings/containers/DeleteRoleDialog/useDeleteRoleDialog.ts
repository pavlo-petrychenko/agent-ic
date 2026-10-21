import { WorkspaceRole } from '@agent-ic/contracts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteRole } from '@/features/settings/communication/hooks/useDeleteRole';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type {
  UseDeleteRoleDialogOptions,
  UseDeleteRoleDialogResult,
} from '@/features/settings/containers/DeleteRoleDialog/DeleteRoleDialog.typedefs';
import type { AppRole } from '@/features/settings/typedefs/role.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function useDeleteRoleDialog({
  roles,
  onDeleted,
}: UseDeleteRoleDialogOptions): UseDeleteRoleDialogResult {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const deleteRole = useDeleteRole();

  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<AppRole | null>(null);
  const [replacementRoleId, setReplacementRoleId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignable = useMemo(
    () => roles.filter((role) => !(role.isSystem && role.key === WorkspaceRole.Owner)),
    [roles],
  );

  const replacementRoles = useMemo(
    () => (target === null ? assignable : assignable.filter((role) => role.id !== target.id)),
    [assignable, target],
  );

  const openDialog = (role: AppRole) => {
    const base =
      assignable.find((candidate) => candidate.key === role.key && candidate.id !== role.id) ??
      assignable.find((candidate) => candidate.id !== role.id) ??
      null;
    setTarget(role);
    setReplacementRoleId(base?.id ?? '');
    setError(null);
    setOpen(true);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setError(null);
    }
  };

  const onConfirm = async () => {
    if (target === null || replacementRoleId === '') {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteRole(target.id, replacementRoleId);
      showToast({
        message: t('roles.delete.success', { name: target.name ?? '' }),
        tone: ToastTone.Ok,
      });
      onDeleted();
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
    roleName: target?.name ?? '',
    memberCount: target?.memberCount ?? 0,
    replacementRoleId,
    replacementRoles,
    onOpenChange,
    onReplacementChange: setReplacementRoleId,
    onConfirm: () => void onConfirm(),
    openDialog,
  };
}
