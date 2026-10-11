import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { RememberWorkspaceUseCase } from '@/modules/identity/use-cases/remember-workspace.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import {
  createOwnedWorkspace,
  createWorkspaceFor,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('RememberWorkspaceUseCase', () => {
  let testbed: IdentityTestbed;
  let rememberWorkspace: RememberWorkspaceUseCase;
  let getMe: GetMeUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    rememberWorkspace = testbed.module.get(RememberWorkspaceUseCase);
    getMe = testbed.module.get(GetMeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('starts with no last workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const me = await getMe.execute(userCtx(workspace.ownerId));

    expect(me.lastWorkspaceId).toBeNull();
  });

  it('remembers a workspace the caller is a member of', async () => {
    const first = await createOwnedWorkspace(testbed);
    const second = await createWorkspaceFor(testbed, first.ownerId);

    const remembered = await rememberWorkspace.execute(userCtx(first.ownerId), {
      workspaceId: second.publicId,
    });
    const me = await getMe.execute(userCtx(first.ownerId));

    expect(remembered.lastWorkspaceId).toBe(second.publicId);
    expect(me.lastWorkspaceId).toBe(second.publicId);
  });

  it('refuses a workspace the caller is not a member of and keeps the last one', async () => {
    const own = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);
    await rememberWorkspace.execute(userCtx(own.ownerId), { workspaceId: own.publicId });

    const attempt = rememberWorkspace.execute(userCtx(own.ownerId), {
      workspaceId: other.publicId,
    });

    await expect(attempt).rejects.toBeInstanceOf(WorkspaceAccessDeniedError);
    const me = await getMe.execute(userCtx(own.ownerId));
    expect(me.lastWorkspaceId).toBe(own.publicId);
  });

  it('keeps each user their own last workspace', async () => {
    const mine = await createOwnedWorkspace(testbed);
    const theirs = await createOwnedWorkspace(testbed);
    const bystander = await createConfirmedAccount(testbed);

    await rememberWorkspace.execute(userCtx(mine.ownerId), { workspaceId: mine.publicId });
    await rememberWorkspace.execute(userCtx(theirs.ownerId), { workspaceId: theirs.publicId });

    expect((await getMe.execute(userCtx(mine.ownerId))).lastWorkspaceId).toBe(mine.publicId);
    expect((await getMe.execute(userCtx(theirs.ownerId))).lastWorkspaceId).toBe(theirs.publicId);
    expect((await getMe.execute(userCtx(bystander.userId))).lastWorkspaceId).toBeNull();
  });

  it('refuses an anonymous caller', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = rememberWorkspace.execute(anonymousCtx(), {
      workspaceId: workspace.publicId,
    });

    await expect(attempt).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
