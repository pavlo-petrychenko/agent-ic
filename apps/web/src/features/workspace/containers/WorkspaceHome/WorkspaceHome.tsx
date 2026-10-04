import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { WORKSPACE_SECTION_PATHS } from '@/features/workspace/constants/navigation.constants';
import type { WorkspaceHomeProps } from '@/features/workspace/containers/WorkspaceHome/WorkspaceHome.typedefs';
import { homeSection } from '@/features/workspace/logic/helpers/navigation.helpers';

export function WorkspaceHome({ workspaceId }: WorkspaceHomeProps) {
  const navigate = useNavigate();
  const role = useWorkspaceShell(workspaceId).data?.active?.role ?? null;

  useEffect(() => {
    if (role !== null) {
      void navigate({
        to: WORKSPACE_SECTION_PATHS[homeSection(role)],
        params: { workspaceId },
        replace: true,
      });
    }
  }, [navigate, role, workspaceId]);

  return null;
}
