import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleNotInvitableError } from '@/modules/identity/errors/role-not-invitable.error';
import { GetInviteLinkUseCase } from '@/modules/identity/use-cases/get-invite-link.use-case';
import { UpdateInviteLinkRoleUseCase } from '@/modules/identity/use-cases/update-invite-link-role.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
  readInviteLinks,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('UpdateInviteLinkRoleUseCase', () => {
  let testbed: IdentityTestbed;
  let updateRole: UpdateInviteLinkRoleUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    updateRole = testbed.module.get(UpdateInviteLinkRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('changes the role and keeps the link and its expiry', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const before = await testbed.module.get(GetInviteLinkUseCase).execute(ownerCtx(workspace));
    const [linkBefore] = await readInviteLinks(testbed, workspace.workspaceId);

    const updated = await updateRole.execute(ownerCtx(workspace), {
      role: WorkspaceRole.Builder,
    });

    const links = await readInviteLinks(testbed, workspace.workspaceId);
    expect(updated.role).toBe(WorkspaceRole.Builder);
    expect(updated.url).toBe(before?.url);
    expect(links).toHaveLength(1);
    expect(links[0]?.expiresAt).toEqual(linkBefore?.expiresAt);
  });

  it('refuses to hand out the owner role', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = updateRole.execute(ownerCtx(workspace), { role: WorkspaceRole.Owner });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotInvitableError);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = updateRole.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
      { role: WorkspaceRole.Admin },
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
