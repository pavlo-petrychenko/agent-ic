import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { TEAM_PATH } from '@/features/settings/constants/route.constants';
import type { SettingsHomeProps } from '@/features/settings/containers/SettingsHome/SettingsHome.typedefs';
import {
  canOpenSection,
  SectionPlaceholderPage,
  useActiveWorkspace,
  WorkspaceSection,
} from '@/features/workspace';

export function SettingsHome({ workspaceId }: SettingsHomeProps) {
  const navigate = useNavigate();
  const role = useActiveWorkspace(workspaceId)?.role ?? null;
  const showTeam = role !== null && canOpenSection(role, WorkspaceSection.Team);

  useEffect(() => {
    if (showTeam) {
      void navigate({ to: TEAM_PATH, params: { workspaceId }, replace: true });
    }
  }, [navigate, showTeam, workspaceId]);

  return role === null || showTeam ? null : (
    <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Settings} />
  );
}
