import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';
import {
  WORKSPACE_HOME_PATH,
  WORKSPACE_STEP_PATH,
} from '@/features/auth/constants/authRoute.constants';
import { toSafeRedirect } from '@/features/auth/logic/helpers/sessionGuard.helpers';
import type { EnterAppOptions } from '@/features/auth/typedefs/authRoute.typedefs';

export function useEnterApp(
  resolveWorkspace: () => Promise<string | null>,
  { replace }: EnterAppOptions = { replace: false },
): (redirectTarget: string | null) => Promise<void> {
  const navigate = useNavigate();

  return useCallback(
    async (redirectTarget) => {
      const target = toSafeRedirect(redirectTarget);
      if (target !== null) {
        await navigate({ href: target, replace });
        return;
      }
      const workspaceId = await resolveWorkspace();
      await (workspaceId === null
        ? navigate({ to: WORKSPACE_STEP_PATH, replace })
        : navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId }, replace }));
    },
    [navigate, resolveWorkspace, replace],
  );
}
