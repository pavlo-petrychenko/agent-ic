import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LeaveWorkspaceUseCase } from '@/modules/identity/use-cases/leave-workspace.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('LeaveWorkspaceUseCase', () => {
  let testbed: IdentityTestbed;
  let leaveWorkspace: LeaveWorkspaceUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    leaveWorkspace = testbed.module.get(LeaveWorkspaceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lets a non-owner leave', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const memberId = await addMember(testbed, workspace);

    const left = await leaveWorkspace.execute(
      workspaceCtx(memberId, workspace.workspaceId, WorkspaceRole.Operator),
      { workspaceId: workspace.publicId },
    );

    const memberships = await readMemberships(testbed, workspace.workspaceId);
    expect(left).toBe(true);
    expect(memberships.map((row) => row.userId)).not.toContain(memberId);
  });

  it('refuses the owner', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = leaveWorkspace.execute(ownerCtx(workspace), {
      workspaceId: workspace.publicId,
    });

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
