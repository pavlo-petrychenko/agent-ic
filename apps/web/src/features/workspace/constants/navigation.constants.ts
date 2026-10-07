import { PermissionResource } from '@agent-ic/contracts';
import type {
  NavEntry,
  NavGroupEntry,
  PlaceholderSection,
} from '@/features/workspace/typedefs/navigation.typedefs';
import { IconName } from '@/shared/ui/Icon';

export enum WorkspaceSection {
  Agents = 'agents',
  Inbox = 'inbox',
  Settings = 'settings',
  Team = 'team',
  General = 'general',
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
  [WorkspaceSection.Team]: '/w/$workspaceId/settings/team',
  [WorkspaceSection.General]: '/w/$workspaceId/settings/general',
} as const;

export const SECTION_RESOURCES: Readonly<Record<WorkspaceSection, PermissionResource | null>> = {
  [WorkspaceSection.Agents]: PermissionResource.Agents,
  [WorkspaceSection.Inbox]: PermissionResource.Inbox,
  [WorkspaceSection.Settings]: null,
  [WorkspaceSection.Team]: PermissionResource.Team,
  [WorkspaceSection.General]: PermissionResource.WorkspaceSettings,
};

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

export const SECTION_ICONS: Readonly<Record<PlaceholderSection, IconName>> = {
  [WorkspaceSection.Agents]: IconName.Agent,
  [WorkspaceSection.Inbox]: IconName.Inbox,
  [WorkspaceSection.Settings]: IconName.Gear,
};
