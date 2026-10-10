import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CountMembersByRoleUseCase } from '@/modules/identity/use-cases/count-members-by-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('CountMembersByRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let countMembersByRole: CountMembersByRoleUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    countMembersByRole = testbed.module.get(CountMembersByRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('counts the members of every role, zero included', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspace);
    await addMember(testbed, workspace);

    const counts = await countMembersByRole.execute(ownerCtx(workspace));

    expect(counts).toEqual([
      { role: WorkspaceRole.Owner, count: 1 },
      { role: WorkspaceRole.Admin, count: 0 },
      { role: WorkspaceRole.Builder, count: 0 },
      { role: WorkspaceRole.Operator, count: 2 },
    ]);
  });

  it('lets a builder count, and never counts another workspace', async () => {
    const workspaceA = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspaceA);
    const workspaceB = await createOwnedWorkspace(testbed);

    const counts = await countMembersByRole.execute(
      workspaceCtx(workspaceB.ownerId, workspaceB.workspaceId, WorkspaceRole.Builder),
    );

    expect(counts.find((entry) => entry.role === WorkspaceRole.Operator)?.count).toBe(0);
    expect(counts.find((entry) => entry.role === WorkspaceRole.Owner)?.count).toBe(1);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = countMembersByRole.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
