import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CannotDeleteOwnerError } from '@/modules/identity/errors/cannot-delete-owner.error';
import { CannotDeleteYourselfError } from '@/modules/identity/errors/cannot-delete-yourself.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { RemoveMemberUseCase } from '@/modules/identity/use-cases/remove-member.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
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

describe('RemoveMemberUseCase', () => {
  let testbed: IdentityTestbed;
  let removeMember: RemoveMemberUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    removeMember = testbed.module.get(RemoveMemberUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('removes a member from the workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const removed = await removeMember.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, workspace, builderId),
    });

    expect(removed).toBe(true);
    expect(
      (await readMemberships(testbed, workspace.workspaceId)).map((row) => row.userId),
    ).not.toContain(builderId);
  });

  it('never removes the owner', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = removeMember.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, workspace, workspace.ownerId),
    });

    await expect(attempt).rejects.toBeInstanceOf(CannotDeleteOwnerError);
  });

  it('refuses an admin removing themselves', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const adminId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Admin);

    const attempt = removeMember.execute(
      workspaceCtx(adminId, workspace.workspaceId, WorkspaceRole.Admin),
      { membershipId: await membershipIdOf(testbed, workspace, adminId) },
    );

    await expect(attempt).rejects.toBeInstanceOf(CannotDeleteYourselfError);
  });

  it('refuses a member of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);

    const attempt = removeMember.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(testbed, other, other.ownerId),
    });

    await expect(attempt).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });

  it('refuses a builder and an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);
    const membershipId = await membershipIdOf(testbed, workspace, operatorId);

    const asBuilder = removeMember.execute(
      workspaceCtx(builderId, workspace.workspaceId, WorkspaceRole.Builder),
      { membershipId },
    );
    const asOperator = removeMember.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
      { membershipId },
    );

    await expect(asBuilder).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(asOperator).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
