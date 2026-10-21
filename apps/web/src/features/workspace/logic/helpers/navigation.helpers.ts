import { PermissionAction } from '@agent-ic/contracts';
import type { ResourcePermissions } from '@agent-ic/contracts';
import {
  NAV_GROUPS,
  SECTION_RESOURCES,
  SETTINGS_NAV_ENTRY,
  WORKSPACE_SECTION_PATHS,
  type WorkspaceSection,
} from '@/features/workspace/constants/navigation.constants';
import { WORKSPACE_ID_PARAM } from '@/features/workspace/constants/route.constants';
import type { NavEntry, NavGroupEntry } from '@/features/workspace/typedefs/navigation.typedefs';
import { hasPermission } from '@/shared/api/helpers/permission.helpers';

const isVisible = (permissions: ResourcePermissions, entry: NavEntry): boolean =>
  entry.resource === null || hasPermission(permissions, entry.resource, PermissionAction.View);

export const visibleNavGroups = (permissions: ResourcePermissions): readonly NavGroupEntry[] =>
  NAV_GROUPS.map((group) => ({
    key: group.key,
    entries: group.entries.filter((entry) => isVisible(permissions, entry)),
  })).filter((group) => group.entries.length > 0);

export const canOpenSection = (
  permissions: ResourcePermissions,
  section: WorkspaceSection,
): boolean => {
  const resource = SECTION_RESOURCES[section];
  return resource === null || hasPermission(permissions, resource, PermissionAction.View);
};

export const homeSection = (permissions: ResourcePermissions): WorkspaceSection =>
  (
    NAV_GROUPS.flatMap((group) => group.entries).find((entry) => isVisible(permissions, entry)) ??
    SETTINGS_NAV_ENTRY
  ).section;

export const sectionHref = (section: WorkspaceSection, workspaceId: string): string =>
  WORKSPACE_SECTION_PATHS[section].replace(WORKSPACE_ID_PARAM, encodeURIComponent(workspaceId));
