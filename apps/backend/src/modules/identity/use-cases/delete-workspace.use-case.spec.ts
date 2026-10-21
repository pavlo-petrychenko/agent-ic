import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkspaceNameMismatchError } from '@/modules/identity/errors/workspace-name-mismatch.error';
import { WrongPasswordError } from '@/modules/identity/errors/wrong-password.error';
import { DeleteWorkspaceUseCase } from '@/modules/identity/use-cases/delete-workspace.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { TEST_PASSWORD } from '@test/support/constants/identity-testing.constants';
import { TEST_WORKSPACE_NAME } from '@test/support/constants/workspace-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  countWorkspaceRows,
  readLastWorkspaceId,
  seedWorkspaceContent,
} from '@test/support/helpers/workspace-deletion.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('DeleteWorkspaceUseCase', () => {
  let testbed: IdentityTestbed;
  let deleteWorkspace: DeleteWorkspaceUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    deleteWorkspace = testbed.module.get(DeleteWorkspaceUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('deletes the workspace for its owner', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const deleted = await deleteWorkspace.execute(ownerCtx(workspace), {
      name: TEST_WORKSPACE_NAME,
      password: TEST_PASSWORD,
    });

    expect(deleted).toBe(true);
    expect(await readMemberships(testbed, workspace.workspaceId)).toHaveLength(0);
  });

  it('removes every row of the workspace at once, with no cleanup job', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspace);
    await seedWorkspaceContent(testbed.module, workspace);
    const before = await countWorkspaceRows(testbed.module, workspace.workspaceId);

    await deleteWorkspace.execute(ownerCtx(workspace), {
      name: TEST_WORKSPACE_NAME,
      password: TEST_PASSWORD,
    });

    const after = await countWorkspaceRows(testbed.module, workspace.workspaceId);
    expect(Object.values(before).every((total) => total > 0)).toBe(true);
    expect(after).toEqual(Object.fromEntries(Object.keys(before).map((table) => [table, 0])));
    expect(await readLastWorkspaceId(testbed.module, workspace.ownerId)).toBeNull();
  });

  it('refuses an admin', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const adminId = await addMember(testbed, workspace);

    const attempt = deleteWorkspace.execute(
      workspaceCtx(adminId, workspace.workspaceId, WorkspaceRole.Admin),
      { name: TEST_WORKSPACE_NAME, password: TEST_PASSWORD },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('refuses a wrong name', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = deleteWorkspace.execute(ownerCtx(workspace), {
      name: 'Wrong name',
      password: TEST_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(WorkspaceNameMismatchError);
  });

  it('refuses a wrong password', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = deleteWorkspace.execute(ownerCtx(workspace), {
      name: TEST_WORKSPACE_NAME,
      password: 'not the password',
    });

    await expect(attempt).rejects.toBeInstanceOf(WrongPasswordError);
  });
});
