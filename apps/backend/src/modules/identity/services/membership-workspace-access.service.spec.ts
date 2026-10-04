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

    expect(await access.resolveRole(workspace.ownerId, workspace.workspaceId)).toBe(
      WorkspaceRole.Owner,
    );
    expect(await access.resolveRole(operatorId, workspace.workspaceId)).toBe(
      WorkspaceRole.Operator,
    );
  });

  it('finds no role in a workspace the user does not belong to', async () => {
    const workspaceA = await createOwnedWorkspace(testbed);
    const workspaceB = await createOwnedWorkspace(testbed);

    expect(await access.resolveRole(workspaceA.ownerId, workspaceB.workspaceId)).toBeNull();
  });
});
