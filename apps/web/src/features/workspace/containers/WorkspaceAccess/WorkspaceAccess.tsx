import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import {
  WORKSPACE_HOME_PATH,
  WORKSPACE_SETUP_PATH,
} from '@/features/workspace/constants/route.constants';
import { WORKSPACE_NAMESPACE } from '@/features/workspace/constants/workspaceI18n.constants';
import type { WorkspaceAccessProps } from '@/features/workspace/containers/WorkspaceAccess/WorkspaceAccess.typedefs';
import { Button } from '@/shared/ui/actions/Button';
import { EmptyState } from '@/shared/ui/display/EmptyState';
import { IconName } from '@/shared/ui/foundations/Icon';

export function WorkspaceAccess({ workspaceId, children }: WorkspaceAccessProps) {
  const { t } = useTranslation(WORKSPACE_NAMESPACE);
  const navigate = useNavigate();
  const { data } = useWorkspaceShell(workspaceId);

  if (data === null) {
    return null;
  }
  if (data.active !== null) {
    return children;
  }
  const fallback = data.workspaces[0] ?? null;

  return (
    <div className="flex min-h-full items-center justify-center">
      <EmptyState
        icon={IconName.Lock}
        title={t('notMember.title')}
        description={t('notMember.description')}
        actions={
          <Button
            onClick={() =>
              void (fallback === null
                ? navigate({ to: WORKSPACE_SETUP_PATH })
                : navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId: fallback.id } }))
            }
          >
            {fallback === null ? t('notMember.create') : t('notMember.action')}
          </Button>
        }
      />
    </div>
  );
}
