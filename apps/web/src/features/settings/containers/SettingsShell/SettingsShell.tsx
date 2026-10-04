import { useTranslation } from 'react-i18next';
import { TEAM_PATH } from '@/features/settings/constants/route.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { SettingsShellProps } from '@/features/settings/containers/SettingsShell/SettingsShell.typedefs';
import { SettingsFrame } from '@/features/settings/view/SettingsFrame';
import { canOpenSection, useActiveWorkspace, WorkspaceSection } from '@/features/workspace';
import { NavGroup } from '@/shared/ui/NavGroup';
import { NavItem } from '@/shared/ui/NavItem';

export function SettingsShell({ workspaceId, children }: SettingsShellProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const active = useActiveWorkspace(workspaceId);
  const showTeam = active !== null && canOpenSection(active.role, WorkspaceSection.Team);

  return (
    <SettingsFrame
      title={t('title')}
      nav={
        showTeam && (
          <NavGroup label={t('nav.workspace')}>
            <NavItem to={TEAM_PATH} params={{ workspaceId }} meta={active.memberCount}>
              {t('nav.team')}
            </NavItem>
          </NavGroup>
        )
      }
    >
      {children}
    </SettingsFrame>
  );
}
