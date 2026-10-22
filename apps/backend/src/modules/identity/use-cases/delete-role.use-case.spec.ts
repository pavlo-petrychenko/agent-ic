import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleNotEditableError } from '@/modules/identity/errors/role-not-editable.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { RoleReplacementInvalidError } from '@/modules/identity/errors/role-replacement-invalid.error';
import type { RoleView } from '@/modules/identity/typedefs/role.typedefs';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '@/modules/identity/use-cases/delete-role.use-case';
import { ListRolesUseCase } from '@/modules/identity/use-cases/list-roles.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  ownerCtx,
  systemRoleIdOf,
  addMemberWithRoleId,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

describe('DeleteRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let createRole: CreateRoleUseCase;
  let deleteRole: DeleteRoleUseCase;
  let listRoles: ListRolesUseCase;

  const createCustomRole = (workspace: TestWorkspace, name: string): Promise<RoleView> =>
    createRole.execute(ownerCtx(workspace), {
      name,
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: null,
    });

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    createRole = testbed.module.get(CreateRoleUseCase);
    deleteRole = testbed.module.get(DeleteRoleUseCase);
    listRoles = testbed.module.get(ListRolesUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('deletes a custom role and moves its members to the replacement', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const custom = await createCustomRole(workspace, 'Content manager');
    const memberId = await addMemberWithRoleId(testbed, workspace, custom.id);

    const deleted = await deleteRole.execute(ownerCtx(workspace), {
      roleId: custom.id,
      replacementRoleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Admin),
    });

    expect(deleted).toBe(true);
    const memberships = await readMemberships(testbed, workspace.workspaceId);
    expect(memberships.find((row) => row.userId === memberId)?.role).toBe(WorkspaceRole.Admin);
    expect((await listRoles.execute(ownerCtx(workspace))).map((role) => role.id)).not.toContain(
      custom.id,
    );
  });

  it('never deletes a system role', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = deleteRole.execute(ownerCtx(workspace), {
      roleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Builder),
      replacementRoleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Admin),
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotEditableError);
  });

  it('refuses the role itself as the replacement', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const custom = await createCustomRole(workspace, 'Content manager');

    const attempt = deleteRole.execute(ownerCtx(workspace), {
      roleId: custom.id,
      replacementRoleId: custom.id,
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleReplacementInvalidError);
  });

  it('refuses the owner role as the replacement', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const custom = await createCustomRole(workspace, 'Content manager');

    const attempt = deleteRole.execute(ownerCtx(workspace), {
      roleId: custom.id,
      replacementRoleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Owner),
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleReplacementInvalidError);
  });

  it('refuses a role of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);
    const foreign = await createCustomRole(other, 'Content manager');

    const attempt = deleteRole.execute(ownerCtx(workspace), {
      roleId: foreign.id,
      replacementRoleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Builder),
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('refuses a replacement role of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);
    const custom = await createCustomRole(workspace, 'Content manager');
    const foreign = await createCustomRole(other, 'Content editor');

    const attempt = deleteRole.execute(ownerCtx(workspace), {
      roleId: custom.id,
      replacementRoleId: foreign.id,
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);
    const custom = await createCustomRole(workspace, 'Content manager');

    const replacementRoleId = await systemRoleIdOf(testbed, workspace, WorkspaceRole.Builder);

    expect(() =>
      deleteRole.execute(workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator), {
        roleId: custom.id,
        replacementRoleId,
      }),
    ).toThrow(PermissionDeniedError);
  });
});
