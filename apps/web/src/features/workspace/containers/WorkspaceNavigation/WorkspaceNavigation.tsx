import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApplyAccountLocale, useLogOut } from '@/features/auth';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { NavGroupKey } from '@/features/workspace/constants/navigation.constants';
import { WorkspaceNavForm } from '@/features/workspace/constants/navigationForm.constants';
import {
  WORKSPACE_HOME_PATH,
  WORKSPACE_SETUP_PATH,
} from '@/features/workspace/constants/route.constants';
import { WORKSPACE_NAMESPACE } from '@/features/workspace/constants/workspaceI18n.constants';
import type { WorkspaceNavigationProps } from '@/features/workspace/containers/WorkspaceNavigation/WorkspaceNavigation.typedefs';
import {
  sectionHref,
  visibleNavGroups,
} from '@/features/workspace/logic/helpers/navigation.helpers';
import type { SidebarItem } from '@/features/workspace/typedefs/sidebar.typedefs';
import { WorkspaceSidebar } from '@/features/workspace/view/WorkspaceSidebar';
import { WorkspaceSwitcher } from '@/features/workspace/view/WorkspaceSwitcher';
import { toInitials } from '@/shared/i18n/helpers/initials.helpers';
import type { NavItemData } from '@/shared/ui/navigation/NavItem';
import { Rail } from '@/shared/ui/navigation/Rail';

export function WorkspaceNavigation({
  workspaceId,
  footerAction,
  form = WorkspaceNavForm.Sidebar,
}: WorkspaceNavigationProps) {
  const { t } = useTranslation(WORKSPACE_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const { logOut } = useLogOut();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useWorkspaceShell(workspaceId);
  const active = data?.active ?? null;
  const groups =
    active === null
      ? []
      : visibleNavGroups(active.role).map((group) => ({
          key: group.key,
          label: group.key === NavGroupKey.Footer ? null : t(`nav.groups.${group.key}`),
          items: group.entries.map((entry) => ({
            section: entry.section,
            icon: entry.icon,
            label: t(`nav.sections.${entry.section}`),
          })),
        }));

  const leaveMenu = (action: () => Promise<void>) => {
    setMenuOpen(false);
    void action();
  };

  useApplyAccountLocale(data?.user.locale ?? null);

  const toRailItem = (item: SidebarItem): NavItemData => ({
    id: item.section,
    to: sectionHref(item.section, workspaceId),
    label: item.label,
    icon: item.icon,
    badgeCount: null,
    badgeLabel: null,
  });

  const switcher = (
    <WorkspaceSwitcher
      open={menuOpen}
      onOpenChange={setMenuOpen}
      activeId={workspaceId}
      activeName={active?.name ?? null}
      workspaces={(data?.workspaces ?? []).map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        initials: toInitials(workspace.name),
        hint: t('switcher.hint', {
          role: tCommon(`roles.name.${workspace.role}`),
          count: workspace.memberCount,
        }),
      }))}
      labels={{
        workspaces: t('switcher.workspaces'),
        account: t('switcher.account'),
        caption: t('header.caption'),
        createWorkspace: t('switcher.createWorkspace'),
        logOut: t('switcher.logOut'),
      }}
      onSelectWorkspace={(id) =>
        id === workspaceId
          ? setMenuOpen(false)
          : leaveMenu(() => navigate({ to: WORKSPACE_HOME_PATH, params: { workspaceId: id } }))
      }
      onCreateWorkspace={() => leaveMenu(() => navigate({ to: WORKSPACE_SETUP_PATH }))}
      onLogOut={() => leaveMenu(logOut)}
      compact={form === WorkspaceNavForm.Rail}
    />
  );

  if (form === WorkspaceNavForm.Rail) {
    return (
      <Rail
        ariaLabel={t('nav.label')}
        logo={switcher}
        groups={groups
          .filter((group) => group.key !== NavGroupKey.Footer)
          .map((group) => group.items.map(toRailItem))}
        footerItems={groups
          .filter((group) => group.key === NavGroupKey.Footer)
          .flatMap((group) => group.items.map(toRailItem))}
      />
    );
  }

  return (
    <WorkspaceSidebar
      workspaceId={workspaceId}
      navLabel={t('nav.label')}
      header={switcher}
      groups={groups}
      user={
        data === null
          ? null
          : {
              name: data.user.name,
              initials: toInitials(data.user.name),
              roleLabel: active === null ? null : tCommon(`roles.name.${active.role}`),
            }
      }
      footerAction={footerAction}
    />
  );
}
