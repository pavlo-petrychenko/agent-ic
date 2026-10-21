import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import { conversations } from '@/modules/conversations/db/conversations.table';
import { messages } from '@/modules/conversations/db/messages.table';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import { memberships } from '@/modules/identity/db/memberships.table';
import { rolePermissions } from '@/modules/identity/db/role-permissions.table';
import { roles } from '@/modules/identity/db/roles.table';
import { workspaces } from '@/modules/identity/db/workspaces.table';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { promptVersions } from '@/modules/prompts/db/prompt-versions.table';
import { prompts } from '@/modules/prompts/db/prompts.table';
import { runSteps } from '@/modules/runs/db/run-steps.table';
import { runs } from '@/modules/runs/db/runs.table';
import type { WorkspaceTable } from '@test/support/typedefs/workspace-testing.typedefs';

export const TEST_WORKSPACE_NAME = 'Kavarnia Lviv';
export const TEST_WORKSPACE_NEW_NAME = 'Kavarnia Kyiv';
export const TEST_TIME_ZONE = 'Europe/Kyiv';
export const UNKNOWN_TIME_ZONE = 'Mars/Olympus_Mons';
export const INVITE_LOOKUPS_PER_HOUR = 20;
export const INVITE_URL_PATTERN = /^https:\/\/\S+\/invite\/([A-Za-z0-9_-]+)$/;
export const TEST_WORKSPACE_OWNER_NAME = 'Workspace owner';
export const TEST_WORKSPACE_OWNER_PASSWORD_HASH = 'unused-password-hash';

export const WORKSPACE_TABLES: readonly WorkspaceTable[] = [
  workspaces,
  roles,
  rolePermissions,
  memberships,
  inviteLinks,
  agents,
  agentVersions,
  conversations,
  messages,
  runs,
  runSteps,
  promptFolders,
  prompts,
  promptVersions,
];
