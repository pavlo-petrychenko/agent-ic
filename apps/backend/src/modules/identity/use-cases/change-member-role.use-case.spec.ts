import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CannotChangeAdminRoleError } from '@/modules/identity/errors/cannot-change-admin-role.error';
import { CannotChangeOwnerRoleError } from '@/modules/identity/errors/cannot-change-owner-role.error';
import { InvalidWorkspaceInputError } from '@/modules/identity/errors/invalid-workspace-input.error';
import { TeamMemberNotFoundError } from '@/modules/identity/errors/team-member-not-found.error';
import { ChangeMemberRoleUseCase } from '@/modules/identity/use-cases/change-member-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  ownerCtx,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

describe('ChangeMemberRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let changeRole: ChangeMemberRoleUseCase;

  const membershipIdOf = async (workspace: TestWorkspace, userId: string): Promise<string> => {
    const memberships = await readMemberships(testbed, workspace.workspaceId);
    const membership = memberships.find((entry) => entry.userId === userId);
    if (membership === undefined) {
      throw new MissingTestDataError(userId);
    }
    return testbed.module.get(IdService).toPublic(IdPrefix.Membership, membership.id);
  };

  const roleOf = async (
    workspace: TestWorkspace,
    userId: string,
  ): Promise<WorkspaceRole | undefined> => {
    const memberships = await readMemberships(testbed, workspace.workspaceId);
    return memberships.find((entry) => entry.userId === userId)?.role;
  };

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    changeRole = testbed.module.get(ChangeMemberRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lets the owner change a member role both ways', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const membershipId = await membershipIdOf(workspace, builderId);

    const promoted = await changeRole.execute(ownerCtx(workspace), {
      membershipId,
      role: WorkspaceRole.Admin,
    });

    expect(promoted.role).toBe(WorkspaceRole.Admin);
    expect(promoted.workspace.id).toBe(workspace.publicId);
    await expect(roleOf(workspace, builderId)).resolves.toBe(WorkspaceRole.Admin);

    const demoted = await changeRole.execute(ownerCtx(workspace), {
      membershipId,
      role: WorkspaceRole.Builder,
    });

    expect(demoted.role).toBe(WorkspaceRole.Builder);
    await expect(roleOf(workspace, builderId)).resolves.toBe(WorkspaceRole.Builder);
  });

  it('lets an admin change a builder and an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const adminId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Admin);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const adminCtx = workspaceCtx(adminId, workspace.workspaceId, WorkspaceRole.Admin);

    const operator = await changeRole.execute(adminCtx, {
      membershipId: await membershipIdOf(workspace, builderId),
      role: WorkspaceRole.Operator,
    });

    expect(operator.role).toBe(WorkspaceRole.Operator);
    await expect(roleOf(workspace, builderId)).resolves.toBe(WorkspaceRole.Operator);
  });

  it('never changes the owner role', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const membershipId = await membershipIdOf(workspace, workspace.ownerId);

    const attempt = changeRole.execute(ownerCtx(workspace), {
      membershipId,
      role: WorkspaceRole.Admin,
    });

    await expect(attempt).rejects.toBeInstanceOf(CannotChangeOwnerRoleError);
    await expect(roleOf(workspace, workspace.ownerId)).resolves.toBe(WorkspaceRole.Owner);
  });

  it('refuses an admin changing another admin or themselves', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const adminId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Admin);
    const otherAdminId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Admin);
    const adminCtx = workspaceCtx(adminId, workspace.workspaceId, WorkspaceRole.Admin);

    const anotherAdmin = changeRole.execute(adminCtx, {
      membershipId: await membershipIdOf(workspace, otherAdminId),
      role: WorkspaceRole.Builder,
    });
    const themselves = changeRole.execute(adminCtx, {
      membershipId: await membershipIdOf(workspace, adminId),
      role: WorkspaceRole.Builder,
    });

    await expect(anotherAdmin).rejects.toBeInstanceOf(CannotChangeAdminRoleError);
    await expect(themselves).rejects.toBeInstanceOf(CannotChangeAdminRoleError);
    await expect(roleOf(workspace, adminId)).resolves.toBe(WorkspaceRole.Admin);
    await expect(roleOf(workspace, otherAdminId)).resolves.toBe(WorkspaceRole.Admin);
  });

  it('refuses to hand out the owner role', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const attempt = changeRole.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(workspace, builderId),
      role: WorkspaceRole.Owner,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidWorkspaceInputError);
    await expect(roleOf(workspace, builderId)).resolves.toBe(WorkspaceRole.Builder);
  });

  it('keeps the role when the same one is passed', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const unchanged = await changeRole.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(workspace, builderId),
      role: WorkspaceRole.Builder,
    });

    expect(unchanged.role).toBe(WorkspaceRole.Builder);
    await expect(roleOf(workspace, builderId)).resolves.toBe(WorkspaceRole.Builder);
  });

  it('refuses a member of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);

    const attempt = changeRole.execute(ownerCtx(workspace), {
      membershipId: await membershipIdOf(other, other.ownerId),
      role: WorkspaceRole.Builder,
    });

    await expect(attempt).rejects.toBeInstanceOf(TeamMemberNotFoundError);
  });

  it('refuses a builder and an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);
    const membershipId = await membershipIdOf(workspace, operatorId);

    const asBuilder = changeRole.execute(
      workspaceCtx(builderId, workspace.workspaceId, WorkspaceRole.Builder),
      { membershipId, role: WorkspaceRole.Admin },
    );
    const asOperator = changeRole.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
      { membershipId, role: WorkspaceRole.Admin },
    );

    await expect(asBuilder).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(asOperator).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
