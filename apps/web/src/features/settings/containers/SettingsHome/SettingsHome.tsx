import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { PROFILE_PATH } from '@/features/settings/constants/route.constants';
import type { SettingsHomeProps } from '@/features/settings/containers/SettingsHome/SettingsHome.typedefs';

export function SettingsHome({ workspaceId }: SettingsHomeProps) {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: PROFILE_PATH, params: { workspaceId }, replace: true });
  }, [navigate, workspaceId]);

  return null;
}
