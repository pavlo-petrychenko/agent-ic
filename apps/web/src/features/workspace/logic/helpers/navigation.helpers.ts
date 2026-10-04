import { can, PermissionAction } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import {
  NAV_GROUPS,
  SETTINGS_NAV_ENTRY,
  type WorkspaceSection,
} from '@/features/workspace/constants/navigation.constants';
import type { NavEntry, NavGroupEntry } from '@/features/workspace/typedefs/navigation.typedefs';

const isVisible = (role: WorkspaceRole, entry: NavEntry): boolean =>
  entry.resource === null || can(role, entry.resource, PermissionAction.View);

export const visibleNavGroups = (role: WorkspaceRole): readonly NavGroupEntry[] =>
  NAV_GROUPS.map((group) => ({
    key: group.key,
    entries: group.entries.filter((entry) => isVisible(role, entry)),
  })).filter((group) => group.entries.length > 0);

export const homeSection = (role: WorkspaceRole): WorkspaceSection =>
  (
    NAV_GROUPS.flatMap((group) => group.entries).find((entry) => isVisible(role, entry)) ??
    SETTINGS_NAV_ENTRY
  ).section;
