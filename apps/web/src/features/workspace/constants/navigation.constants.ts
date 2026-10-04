import { PermissionResource } from '@agent-ic/contracts';
import type { NavEntry, NavGroupEntry } from '@/features/workspace/typedefs/navigation.typedefs';
import { IconName } from '@/shared/ui/Icon';

export enum WorkspaceSection {
  Agents = 'agents',
  Inbox = 'inbox',
  Settings = 'settings',
}

export enum NavGroupKey {
  Build = 'build',
  Operate = 'operate',
  Footer = 'footer',
}

export const WORKSPACE_SECTION_PATHS = {
  [WorkspaceSection.Agents]: '/w/$workspaceId/agents',
  [WorkspaceSection.Inbox]: '/w/$workspaceId/inbox',
  [WorkspaceSection.Settings]: '/w/$workspaceId/settings',
} as const;

export const SETTINGS_NAV_ENTRY: NavEntry = {
  section: WorkspaceSection.Settings,
  icon: IconName.Gear,
  resource: null,
};

export const NAV_GROUPS: readonly NavGroupEntry[] = [
  {
    key: NavGroupKey.Build,
    entries: [
      {
        section: WorkspaceSection.Agents,
        icon: IconName.Agent,
        resource: PermissionResource.Agents,
      },
    ],
  },
  {
    key: NavGroupKey.Operate,
    entries: [
      { section: WorkspaceSection.Inbox, icon: IconName.Inbox, resource: PermissionResource.Inbox },
    ],
  },
  { key: NavGroupKey.Footer, entries: [SETTINGS_NAV_ENTRY] },
];

export const SECTION_ICONS: Readonly<Record<WorkspaceSection, IconName>> = {
  [WorkspaceSection.Agents]: IconName.Agent,
  [WorkspaceSection.Inbox]: IconName.Inbox,
  [WorkspaceSection.Settings]: IconName.Gear,
};
