import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INVITE_LINK_TTL_SECONDS } from '@/modules/identity/constants/workspace.constants';
import { InviteExpiredError } from '@/modules/identity/errors/invite-expired.error';
import { AcceptInviteUseCase } from '@/modules/identity/use-cases/accept-invite.use-case';
import { UpdateInviteLinkRoleUseCase } from '@/modules/identity/use-cases/update-invite-link-role.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { TEST_WORKSPACE_NAME } from '@test/support/constants/workspace-testing.constants';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import {
  createOwnedWorkspace,
  inviteTokenOf,
  joinWorkspace,
  ownerCtx,
  readInviteLinks,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('AcceptInviteUseCase', () => {
  let testbed: IdentityTestbed;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('joins with the role of the link and remembers the link', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const newcomer = await createConfirmedAccount(testbed);
    const token = await inviteTokenOf(testbed, workspace);

    const joined = await joinWorkspace(testbed, newcomer.userId, token);

    const [link] = await readInviteLinks(testbed, workspace.workspaceId);
    const membership = (await readMemberships(testbed, workspace.workspaceId)).find(
      (row) => row.userId === newcomer.userId,
    );
    expect(joined).toEqual({
      workspace: {
        id: workspace.publicId,
        name: TEST_WORKSPACE_NAME,
        timeZone: expect.any(String),
        memberCount: 2,
      },
      role: WorkspaceRole.Operator,
    });
    expect(membership).toMatchObject({ role: WorkspaceRole.Operator, inviteLinkId: link?.id });
  });

  it('is idempotent: joining twice keeps one membership and its role', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const newcomer = await createConfirmedAccount(testbed);
    const token = await inviteTokenOf(testbed, workspace);
    await joinWorkspace(testbed, newcomer.userId, token);
    const first = (await readMemberships(testbed, workspace.workspaceId)).find(
      (row) => row.userId === newcomer.userId,
    );
    await testbed.module
      .get(UpdateInviteLinkRoleUseCase)
      .execute(ownerCtx(workspace), { role: WorkspaceRole.Admin });

    const again = await joinWorkspace(testbed, newcomer.userId, token);

    const memberships = await readMemberships(testbed, workspace.workspaceId);
    expect(again.role).toBe(WorkspaceRole.Operator);
    expect(memberships).toHaveLength(2);
    expect(memberships.find((row) => row.userId === newcomer.userId)?.id).toBe(first?.id);
  });

  it('keeps the owner an owner when they open their own link', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const token = await inviteTokenOf(testbed, workspace);

    const joined = await joinWorkspace(testbed, workspace.ownerId, token);

    expect(joined.role).toBe(WorkspaceRole.Owner);
    expect(await readMemberships(testbed, workspace.workspaceId)).toHaveLength(1);
  });

  it('rejects an expired link', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const newcomer = await createConfirmedAccount(testbed);
    const token = await inviteTokenOf(testbed, workspace);

    testbed.clock.advanceBy(
      INVITE_LINK_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );
    const attempt = joinWorkspace(testbed, newcomer.userId, token);

    await expect(attempt).rejects.toBeInstanceOf(InviteExpiredError);
    expect(await readMemberships(testbed, workspace.workspaceId)).toHaveLength(1);
  });

  it('requires a signed-in user', async () => {
    const attempt = testbed.module
      .get(AcceptInviteUseCase)
      .execute(anonymousCtx(), { token: 'any' });

    await expect(attempt).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
