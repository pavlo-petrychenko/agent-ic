import { PermissionResource } from '@agent-ic/contracts';
import type {
  NavEntry,
  NavGroupEntry,
  PlaceholderSection,
} from '@/features/workspace/typedefs/navigation.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon';

export enum WorkspaceSection {
  Agents = 'agents',
  Prompts = 'prompts',
  Inbox = 'inbox',
  Testing = 'testing',
  Settings = 'settings',
  Team = 'team',
  General = 'general',
  Roles = 'roles',
  Usage = 'usage',
  LlmKeys = 'llmKeys',
  Profile = 'profile',
  Notifications = 'notifications',
}

export enum NavGroupKey {
  Build = 'build',
  Operate = 'operate',
  Footer = 'footer',
}

export const WORKSPACE_SECTION_PATHS = {
  [WorkspaceSection.Agents]: '/w/$workspaceId/agents',
  [WorkspaceSection.Prompts]: '/w/$workspaceId/prompts',
  [WorkspaceSection.Inbox]: '/w/$workspaceId/inbox',
  [WorkspaceSection.Testing]: '/w/$workspaceId/testing',
  [WorkspaceSection.Settings]: '/w/$workspaceId/settings',
  [WorkspaceSection.Team]: '/w/$workspaceId/settings/team',
  [WorkspaceSection.General]: '/w/$workspaceId/settings/general',
  [WorkspaceSection.Roles]: '/w/$workspaceId/settings/roles',
  [WorkspaceSection.Usage]: '/w/$workspaceId/settings/usage',
  [WorkspaceSection.LlmKeys]: '/w/$workspaceId/settings/llm',
  [WorkspaceSection.Profile]: '/w/$workspaceId/settings/profile',
  [WorkspaceSection.Notifications]: '/w/$workspaceId/settings/notifications',
} as const;

export const SECTION_RESOURCES: Readonly<Record<WorkspaceSection, PermissionResource | null>> = {
  [WorkspaceSection.Agents]: PermissionResource.Agents,
  [WorkspaceSection.Prompts]: PermissionResource.Prompts,
  [WorkspaceSection.Inbox]: PermissionResource.Inbox,
  [WorkspaceSection.Testing]: PermissionResource.Testing,
  [WorkspaceSection.Settings]: null,
  [WorkspaceSection.Team]: PermissionResource.Team,
  [WorkspaceSection.General]: PermissionResource.WorkspaceSettings,
  [WorkspaceSection.Roles]: PermissionResource.Team,
  [WorkspaceSection.Usage]: PermissionResource.WorkspaceSettings,
  [WorkspaceSection.LlmKeys]: PermissionResource.WorkspaceSettings,
  [WorkspaceSection.Profile]: null,
  [WorkspaceSection.Notifications]: null,
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
      {
        section: WorkspaceSection.Prompts,
        icon: IconName.Compl,
        resource: PermissionResource.Prompts,
      },
    ],
  },
  {
    key: NavGroupKey.Operate,
    entries: [
      { section: WorkspaceSection.Inbox, icon: IconName.Inbox, resource: PermissionResource.Inbox },
      {
        section: WorkspaceSection.Testing,
        icon: IconName.Flask,
        resource: PermissionResource.Testing,
      },
    ],
  },
  { key: NavGroupKey.Footer, entries: [SETTINGS_NAV_ENTRY] },
];

export const SECTION_ICONS: Readonly<Record<PlaceholderSection, IconName>> = {
  [WorkspaceSection.Inbox]: IconName.Inbox,
  [WorkspaceSection.Settings]: IconName.Gear,
};
