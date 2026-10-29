import { AgentVersionKind } from '@/modules/agents';
import type { AutoCloseVersion } from '@/modules/agents';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';
import type { InactivityScope } from '@/modules/conversations/typedefs/auto-close.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';

export const inactivityScopesOf = (version: AutoCloseVersion, now: Date): InactivityScope[] => {
  const silentSince = new Date(
    now.getTime() - version.afterMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
  );
  const scope = (mode: ConversationMode, simulationVersionId: string | null): InactivityScope => ({
    agentId: version.agentId,
    mode,
    simulationVersionId,
    silentSince,
  });
  return [
    ...(version.live ? [scope(ConversationMode.Live, null)] : []),
    ...(version.kind === AgentVersionKind.Draft ? [scope(ConversationMode.Simulation, null)] : []),
    ...(version.kind === AgentVersionKind.Published
      ? [scope(ConversationMode.Simulation, version.versionId)]
      : []),
  ];
};

export const inactivityScopesByWorkspace = (
  versions: readonly AutoCloseVersion[],
  now: Date,
): ReadonlyMap<string, readonly InactivityScope[]> => {
  const byWorkspace = new Map<string, InactivityScope[]>();
  for (const version of versions) {
    const scopes = byWorkspace.get(version.workspaceId) ?? [];
    scopes.push(...inactivityScopesOf(version, now));
    byWorkspace.set(version.workspaceId, scopes);
  }
  return byWorkspace;
};
