import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InviteInvalidError } from '@/modules/identity/errors/invite-invalid.error';
import { GetInviteInfoUseCase } from '@/modules/identity/use-cases/get-invite-info.use-case';
import { ResetInviteLinkUseCase } from '@/modules/identity/use-cases/reset-invite-link.use-case';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { UpdateInviteLinkRoleUseCase } from '@/modules/identity/use-cases/update-invite-link-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { anonymousCtx, signUpInput } from '@test/support/fixtures/identity.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  inviteTokenIn,
  inviteTokenOf,
  joinWorkspace,
  ownerCtx,
  readInviteLinks,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ResetInviteLinkUseCase', () => {
  let testbed: IdentityTestbed;
  let resetInviteLink: ResetInviteLinkUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    resetInviteLink = testbed.module.get(ResetInviteLinkUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('issues a new link with the same role and keeps one active link', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await testbed.module
      .get(UpdateInviteLinkRoleUseCase)
      .execute(ownerCtx(workspace), { role: WorkspaceRole.Builder });
    const oldToken = await inviteTokenOf(testbed, workspace);

    const reset = await resetInviteLink.execute(ownerCtx(workspace));

    const links = await readInviteLinks(testbed, workspace.workspaceId);
    expect(inviteTokenIn(reset.url)).not.toBe(oldToken);
    expect(reset).toMatchObject({ role: WorkspaceRole.Builder, joinedCount: 0 });
    expect(links.filter((link) => link.revokedAt === null)).toHaveLength(1);
    expect(links).toHaveLength(2);
  });

  it('stops the old link from working anywhere', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const oldToken = await inviteTokenOf(testbed, workspace);
    const latecomer = await createConfirmedAccount(testbed);

    await resetInviteLink.execute(ownerCtx(workspace));

    await expect(
      testbed.module.get(GetInviteInfoUseCase).execute(anonymousCtx(), { token: oldToken }),
    ).rejects.toBeInstanceOf(InviteInvalidError);
    await expect(joinWorkspace(testbed, latecomer.userId, oldToken)).rejects.toBeInstanceOf(
      InviteInvalidError,
    );
    await expect(
      testbed.module
        .get(SignUpUseCase)
        .execute(anonymousCtx(), signUpInput({ inviteToken: oldToken })),
    ).rejects.toBeInstanceOf(InviteInvalidError);
  });

  it('lets the new link work', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const reset = await resetInviteLink.execute(ownerCtx(workspace));
    const newcomer = await createConfirmedAccount(testbed);

    const joined = await joinWorkspace(testbed, newcomer.userId, inviteTokenIn(reset.url));

    expect(joined.role).toBe(WorkspaceRole.Operator);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = resetInviteLink.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
