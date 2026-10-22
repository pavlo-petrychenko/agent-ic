import { permissionKey, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleNameTakenError } from '@/modules/identity/errors/role-name-taken.error';
import { RoleNotEditableError } from '@/modules/identity/errors/role-not-editable.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import type { RolePermission, RoleView } from '@/modules/identity/typedefs/role.typedefs';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { RenameRoleUseCase } from '@/modules/identity/use-cases/rename-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  ownerCtx,
  systemRoleIdOf,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

const permissionKeys = (permissions: readonly RolePermission[]): ReadonlySet<string> =>
  new Set(permissions.map((permission) => permissionKey(permission.resource, permission.action)));

describe('RenameRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let createRole: CreateRoleUseCase;
  let renameRole: RenameRoleUseCase;

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
    renameRole = testbed.module.get(RenameRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('renames a custom role and keeps its permissions', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const created = await createCustomRole(workspace, 'Content manager');

    const renamed = await renameRole.execute(ownerCtx(workspace), {
      roleId: created.id,
      name: 'Content editor',
    });

    expect(renamed).toMatchObject({
      id: created.id,
      key: WorkspaceRole.Builder,
      name: 'Content editor',
      isSystem: false,
      memberCount: 0,
    });
    expect(permissionKeys(renamed.permissions)).toEqual(permissionKeys(created.permissions));
  });

  it('keeps the name when the same one is passed', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const created = await createCustomRole(workspace, 'Content manager');

    const renamed = await renameRole.execute(ownerCtx(workspace), {
      roleId: created.id,
      name: 'Content manager',
    });

    expect(renamed.name).toBe('Content manager');
  });

  it('never renames a system role', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = renameRole.execute(ownerCtx(workspace), {
      roleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Builder),
      name: 'Content editor',
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotEditableError);
  });

  it('refuses a name that another custom role already uses', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    await createCustomRole(workspace, 'Content manager');
    const second = await createCustomRole(workspace, 'Agent reader');

    const attempt = renameRole.execute(ownerCtx(workspace), {
      roleId: second.id,
      name: 'content MANAGER',
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNameTakenError);
  });

  it('refuses a role of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);
    const foreign = await createCustomRole(other, 'Content manager');

    const attempt = renameRole.execute(ownerCtx(workspace), {
      roleId: foreign.id,
      name: 'Content editor',
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);
    const created = await createCustomRole(workspace, 'Content manager');

    expect(() =>
      renameRole.execute(workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator), {
        roleId: created.id,
        name: 'Content editor',
      }),
    ).toThrow(PermissionDeniedError);
  });
});
