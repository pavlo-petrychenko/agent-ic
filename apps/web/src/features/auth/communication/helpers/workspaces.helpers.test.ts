import { describe, expect, it } from 'vitest';
import type { MyWorkspacesQuery } from '@/features/auth/communication/gql/query/myWorkspaces.generated';
import { landingWorkspaceId } from '@/features/auth/communication/helpers/workspaces.helpers';

const myWorkspaces = (
  workspaceIds: readonly string[],
  lastWorkspaceId: string | null,
): MyWorkspacesQuery => ({
  me: { id: 'usr_1', lastWorkspaceId },
  myWorkspaces: workspaceIds.map((id) => ({ workspace: { id } })),
});

describe('landingWorkspaceId', () => {
  it('prefers the workspace opened last', () => {
    expect(landingWorkspaceId(myWorkspaces(['ws_first', 'ws_last'], 'ws_last'))).toBe('ws_last');
  });

  it('falls back to the first workspace without a last one', () => {
    expect(landingWorkspaceId(myWorkspaces(['ws_first', 'ws_second'], null))).toBe('ws_first');
  });

  it('falls back to the first workspace when the last one is no longer listed', () => {
    expect(landingWorkspaceId(myWorkspaces(['ws_first'], 'ws_gone'))).toBe('ws_first');
  });

  it('has no landing workspace without memberships or data', () => {
    expect(landingWorkspaceId(myWorkspaces([], 'ws_gone'))).toBeNull();
    expect(landingWorkspaceId(null)).toBeNull();
  });
});
