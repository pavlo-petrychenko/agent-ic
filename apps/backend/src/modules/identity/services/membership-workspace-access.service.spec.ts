import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MembershipWorkspaceAccessService } from '@/modules/identity/services/membership-workspace-access.service';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import { addMember, createOwnedWorkspace } from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('MembershipWorkspaceAccessService', () => {
  let testbed: IdentityTestbed;
  let access: MembershipWorkspaceAccessService;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    access = testbed.module.get(MembershipWorkspaceAccessService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('reads the role of each member', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    expect(await access.resolveAccess(workspace.ownerId, workspace.workspaceId)).toMatchObject({
      workspaceId: workspace.workspaceId,
      role: WorkspaceRole.Owner,
    });
    expect(await access.resolveAccess(operatorId, workspace.workspaceId)).toMatchObject({
      role: WorkspaceRole.Operator,
    });
  });

  it('finds no role in a workspace the user does not belong to', async () => {
    const workspaceA = await createOwnedWorkspace(testbed);
    const workspaceB = await createOwnedWorkspace(testbed);

    expect(await access.resolveAccess(workspaceA.ownerId, workspaceB.workspaceId)).toBeNull();
  });
});
