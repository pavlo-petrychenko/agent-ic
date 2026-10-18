import { useTranslation } from 'react-i18next';
import { SYSTEM_ROLE_COUNT } from '@/features/settings/constants/roles.constants';
import {
  GENERAL_PATH,
  LLM_KEYS_PATH,
  NOTIFICATIONS_PATH,
  PROFILE_PATH,
  ROLES_PATH,
  TEAM_PATH,
  USAGE_PATH,
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
  const showTeam = active !== null && canOpenSection(active.permissions, WorkspaceSection.Team);
  const showGeneral =
    active !== null && canOpenSection(active.permissions, WorkspaceSection.General);
  const showRoles = active !== null && canOpenSection(active.permissions, WorkspaceSection.Roles);
  const showUsage = active !== null && canOpenSection(active.permissions, WorkspaceSection.Usage);
  const showLlmKeys =
    active !== null && canOpenSection(active.permissions, WorkspaceSection.LlmKeys);

  const hasWorkspaceNav = showGeneral || showTeam || showRoles || showUsage || showLlmKeys;

  return (
    <SettingsFrame
      title={t('title')}
      nav={
        <>
          <NavGroup label={t('nav.you')}>
            <NavItem to={PROFILE_PATH} params={{ workspaceId }}>
              {t('nav.profile')}
            </NavItem>
            <NavItem to={NOTIFICATIONS_PATH} params={{ workspaceId }}>
              {t('nav.notifications')}
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
                <NavItem to={ROLES_PATH} params={{ workspaceId }} meta={SYSTEM_ROLE_COUNT}>
                  {t('nav.roles')}
                </NavItem>
              )}

              {showUsage && (
                <NavItem to={USAGE_PATH} params={{ workspaceId }}>
                  {t('nav.usage')}
                </NavItem>
              )}

              {showLlmKeys && (
                <NavItem to={LLM_KEYS_PATH} params={{ workspaceId }}>
                  {t('nav.llmKeys')}
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
