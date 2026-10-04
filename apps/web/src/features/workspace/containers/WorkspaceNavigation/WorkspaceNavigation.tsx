import { useTranslation } from 'react-i18next';
import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import { NavGroupKey } from '@/features/workspace/constants/navigation.constants';
import { WORKSPACE_NAMESPACE } from '@/features/workspace/constants/workspaceI18n.constants';
import type { WorkspaceNavigationProps } from '@/features/workspace/containers/WorkspaceNavigation/WorkspaceNavigation.typedefs';
import { toInitials } from '@/features/workspace/logic/helpers/initials.helpers';
import { visibleNavGroups } from '@/features/workspace/logic/helpers/navigation.helpers';
import { WorkspaceIdentity } from '@/features/workspace/view/WorkspaceIdentity';
import { WorkspaceSidebar } from '@/features/workspace/view/WorkspaceSidebar';

export function WorkspaceNavigation({ workspaceId, footerAction }: WorkspaceNavigationProps) {
  const { t } = useTranslation(WORKSPACE_NAMESPACE);
  const { t: tCommon } = useTranslation();
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

  return (
    <WorkspaceSidebar
      workspaceId={workspaceId}
      navLabel={t('nav.label')}
      header={<WorkspaceIdentity name={active?.name ?? null} caption={t('header.caption')} />}
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
