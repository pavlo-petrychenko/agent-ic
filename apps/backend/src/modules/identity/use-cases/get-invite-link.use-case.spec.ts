import { DEFAULT_INVITE_ROLE, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetInviteLinkUseCase } from '@/modules/identity/use-cases/get-invite-link.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { INVITE_URL_PATTERN } from '@test/support/constants/workspace-testing.constants';
import { userCtx } from '@test/support/fixtures/identity.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  inviteTokenIn,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('GetInviteLinkUseCase', () => {
  let testbed: IdentityTestbed;
  let getInviteLink: GetInviteLinkUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    getInviteLink = testbed.module.get(GetInviteLinkUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('shows the owner the same link every time with the joined count', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspace);

    const first = await getInviteLink.execute(ownerCtx(workspace));
    const second = await getInviteLink.execute(ownerCtx(workspace));

    expect(first?.url).toMatch(INVITE_URL_PATTERN);
    expect(second?.url).toBe(first?.url);
    expect(first).toMatchObject({ role: DEFAULT_INVITE_ROLE, joinedCount: 1 });
  });

  it('never returns the stored hash as the token', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const link = await getInviteLink.execute(ownerCtx(workspace));

    expect(inviteTokenIn(link?.url ?? '')).not.toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = getInviteLink.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('refuses a request without a workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = getInviteLink.execute(userCtx(workspace.ownerId));

    await expect(attempt).rejects.toBeInstanceOf(WorkspaceAccessDeniedError);
  });
});
