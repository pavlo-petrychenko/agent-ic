import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListMyWorkspacesUseCase } from '@/modules/identity/use-cases/list-my-workspaces.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import {
  createOwnedWorkspace,
  createWorkspaceFor,
  inviteTokenOf,
  joinWorkspace,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ListMyWorkspacesUseCase', () => {
  let testbed: IdentityTestbed;
  let listMyWorkspaces: ListMyWorkspacesUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    listMyWorkspaces = testbed.module.get(ListMyWorkspacesUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists every workspace of the user with their role and the member count', async () => {
    const user = await createConfirmedAccount(testbed);
    const owned = await createWorkspaceFor(testbed, user.userId);
    const joined = await createOwnedWorkspace(testbed);
    await joinWorkspace(testbed, user.userId, await inviteTokenOf(testbed, joined));

    const workspaces = await listMyWorkspaces.execute(userCtx(user.userId));

    expect(workspaces).toHaveLength(2);
    expect(workspaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workspace: expect.objectContaining({ id: owned.publicId, memberCount: 1 }),
          role: WorkspaceRole.Owner,
        }),
        expect.objectContaining({
          workspace: expect.objectContaining({ id: joined.publicId, memberCount: 2 }),
          role: WorkspaceRole.Operator,
        }),
      ]),
    );
  });

  it('returns nothing for a user without a workspace', async () => {
    const user = await createConfirmedAccount(testbed);

    expect(await listMyWorkspaces.execute(userCtx(user.userId))).toEqual([]);
  });

  it('requires a signed-in user', async () => {
    await expect(listMyWorkspaces.execute(anonymousCtx())).rejects.toBeInstanceOf(
      AuthenticationRequiredError,
    );
  });
});
