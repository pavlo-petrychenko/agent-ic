import { useTranslation } from 'react-i18next';
import { ROLE_FIXTURES } from '@/features/settings/constants/roles.constants';
import {
  GENERAL_PATH,
  ROLES_PATH,
  PROFILE_PATH,
  TEAM_PATH,
} from '@/features/settings/constants/route.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { SettingsShellProps } from '@/features/settings/containers/SettingsShell/SettingsShell.typedefs';
import { SettingsFrame } from '@/features/settings/view/SettingsFrame';
import { canOpenSection, useActiveWorkspace, WorkspaceSection } from '@/features/workspace';
import { NavGroup } from '@/shared/ui/navigation/NavGroup';
import { NavItem } from '@/shared/ui/navigation/NavItem';

export function SettingsShell({ workspaceId, children }: SettingsShellProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const active = useActiveWorkspace(workspaceId);
  const showTeam = active !== null && canOpenSection(active.role, WorkspaceSection.Team);
  const showGeneral = active !== null && canOpenSection(active.role, WorkspaceSection.General);
  const showRoles = active !== null && canOpenSection(active.role, WorkspaceSection.Roles);

  const hasWorkspaceNav = showGeneral || showTeam || showRoles;

  return (
    <SettingsFrame
      title={t('title')}
      nav={
        <>
          <NavGroup label={t('nav.you')}>
            <NavItem to={PROFILE_PATH} params={{ workspaceId }}>
              {t('nav.profile')}
            </NavItem>
          </NavGroup>
          {hasWorkspaceNav && (
            <NavGroup label={t('nav.workspace')}>
              {showGeneral && (
                <NavItem to={GENERAL_PATH} params={{ workspaceId }}>
                  {t('nav.general')}
                </NavItem>
              )}

              {showTeam && (
                <NavItem to={TEAM_PATH} params={{ workspaceId }} meta={active.memberCount}>
                  {t('nav.team')}
                </NavItem>
              )}

              {showRoles && (
                <NavItem to={ROLES_PATH} params={{ workspaceId }} meta={ROLE_FIXTURES.length}>
                  {t('nav.roles')}
                </NavItem>
              )}
            </NavGroup>
          )}
        </>
      }
    >
      {children}
    </SettingsFrame>
  );
}
