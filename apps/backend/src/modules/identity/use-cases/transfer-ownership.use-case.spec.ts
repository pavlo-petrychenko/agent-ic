import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CannotTransferToYourselfError } from '@/modules/identity/errors/cannot-transfer-to-yourself.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { WrongPasswordError } from '@/modules/identity/errors/wrong-password.error';
import { TransferOwnershipUseCase } from '@/modules/identity/use-cases/transfer-ownership.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_PASSWORD } from '@test/support/constants/identity-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  membershipIdOf,
  ownerCtx,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('TransferOwnershipUseCase', () => {
  let testbed: IdentityTestbed;
  let transferOwnership: TransferOwnershipUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    transferOwnership = testbed.module.get(TransferOwnershipUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('hands the workspace to another member and demotes the old owner', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const targetId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const membershipId = await membershipIdOf(testbed, workspace, targetId);

    const transferred = await transferOwnership.execute(ownerCtx(workspace), {
      membershipId,
      password: TEST_PASSWORD,
    });

    expect(transferred.role).toBe(WorkspaceRole.Admin);
    expect(transferred.workspace.id).toBe(workspace.publicId);
    const memberships = await readMemberships(testbed, workspace.workspaceId);
    expect(memberships.find((row) => row.userId === targetId)?.role).toBe(WorkspaceRole.Owner);
    expect(memberships.find((row) => row.userId === workspace.ownerId)?.role).toBe(
      WorkspaceRole.Admin,
    );
  });

  it('refuses a wrong password and changes nothing', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const targetId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const attempt = transferOwnership.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, workspace, targetId),
      password: 'not the password',
    });

    await expect(attempt).rejects.toBeInstanceOf(WrongPasswordError);
    const memberships = await readMemberships(testbed, workspace.workspaceId);
    expect(memberships.find((row) => row.userId === workspace.ownerId)?.role).toBe(
      WorkspaceRole.Owner,
    );
    expect(memberships.find((row) => row.userId === targetId)?.role).toBe(WorkspaceRole.Builder);
  });

  it('refuses to transfer to the owner themselves', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = transferOwnership.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, workspace, workspace.ownerId),
      password: TEST_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(CannotTransferToYourselfError);
  });

  it('refuses a member of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);

    const attempt = transferOwnership.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, other, other.ownerId),
      password: TEST_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });

  it('refuses an admin', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const adminId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Admin);
    const targetId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const attempt = transferOwnership.execute(
      workspaceCtx(adminId, workspace.workspaceId, WorkspaceRole.Admin),
      {
        membershipId: await membershipIdOf(testbed, workspace, targetId),
        password: TEST_PASSWORD,
      },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
