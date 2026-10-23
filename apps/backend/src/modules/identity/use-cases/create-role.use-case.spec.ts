import {
  IdPrefix,
  PermissionAction,
  PermissionResource,
  permissionKey,
  permissionsForRole,
  WorkspaceRole,
} from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvalidRoleInputError } from '@/modules/identity/errors/invalid-role-input.error';
import { RoleBaseInvalidError } from '@/modules/identity/errors/role-base-invalid.error';
import { RoleNameTakenError } from '@/modules/identity/errors/role-name-taken.error';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const permissionKeys = (permissions: readonly RolePermission[]): ReadonlySet<string> =>
  new Set(permissions.map((permission) => permissionKey(permission.resource, permission.action)));

describe('CreateRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let createRole: CreateRoleUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    createRole = testbed.module.get(CreateRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates a custom role with the permissions of its base role', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const role = await createRole.execute(ownerCtx(workspace), {
      name: 'Content manager',
      baseRole: WorkspaceRole.Builder,
      description: 'Writes and publishes content',
      permissions: null,
    });

    expect(role).toMatchObject({
      key: WorkspaceRole.Builder,
      name: 'Content manager',
      description: 'Writes and publishes content',
      isSystem: false,
      memberCount: 0,
    });
    expect(role.id).toMatch(new RegExp(`^${IdPrefix.Role}_`));
    expect(permissionKeys(role.permissions)).toEqual(permissionsForRole(WorkspaceRole.Builder));
  });

  it('uses the permissions that are passed explicitly', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const role = await createRole.execute(ownerCtx(workspace), {
      name: 'Agent reader',
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: [
        { resource: PermissionResource.Agents, action: PermissionAction.View },
        { resource: PermissionResource.Prompts, action: PermissionAction.Edit },
      ],
    });

    expect(permissionKeys(role.permissions)).toEqual(
      new Set([
        permissionKey(PermissionResource.Agents, PermissionAction.View),
        permissionKey(PermissionResource.Prompts, PermissionAction.Edit),
      ]),
    );
  });

  it('refuses a name that another custom role already uses', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const input = {
      name: 'Content manager',
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: null,
    };
    await createRole.execute(ownerCtx(workspace), input);

    const attempt = createRole.execute(ownerCtx(workspace), {
      ...input,
      name: '  content MANAGER  ',
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNameTakenError);
  });

  it('refuses the owner role as a base', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    expect(() =>
      createRole.execute(ownerCtx(workspace), {
        name: 'Second owner',
        baseRole: WorkspaceRole.Owner,
        description: null,
        permissions: null,
      }),
    ).toThrow(RoleBaseInvalidError);
  });

  it('refuses an empty name', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    expect(() =>
      createRole.execute(ownerCtx(workspace), {
        name: '   ',
        baseRole: WorkspaceRole.Builder,
        description: null,
        permissions: null,
      }),
    ).toThrow(InvalidRoleInputError);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);

    expect(() =>
      createRole.execute(workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator), {
        name: 'Content manager',
        baseRole: WorkspaceRole.Builder,
        description: null,
        permissions: null,
      }),
    ).toThrow(PermissionDeniedError);
  });
});
