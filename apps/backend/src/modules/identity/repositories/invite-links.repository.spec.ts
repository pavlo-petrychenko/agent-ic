import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InviteLinksRepository } from '@/modules/identity/repositories/invite-links.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  activeInviteLinkOf,
  createOwnedWorkspace,
  readInviteLinks,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

describe('InviteLinksRepository across tenants', () => {
  let testbed: IdentityTestbed;
  let repository: InviteLinksRepository;
  let tenants: TenantTransactionService;
  let workspaceA: TestWorkspace;
  let workspaceB: TestWorkspace;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    repository = testbed.module.get(InviteLinksRepository);
    tenants = testbed.module.get(TenantTransactionService);
    workspaceA = await createOwnedWorkspace(testbed);
    workspaceB = await createOwnedWorkspace(testbed);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('never shows workspace B the invite link of workspace A', async () => {
    const aFromB = await tenants.run(workspaceB.workspaceId, () =>
      repository.findActive(workspaceA.workspaceId),
    );
    const ownFromB = await tenants.run(workspaceB.workspaceId, () =>
      repository.findActive(workspaceB.workspaceId),
    );

    expect(aFromB).toBeNull();
    expect(ownFromB?.workspaceId).toBe(workspaceB.workspaceId);
  });

  it('cannot change the link of workspace A from workspace B', async () => {
    const linkOfA = await activeInviteLinkOf(testbed, workspaceA.workspaceId);

    await tenants.run(workspaceB.workspaceId, async () => {
      await repository.updateRole(workspaceA.workspaceId, linkOfA.id, WorkspaceRole.Admin);
      await repository.revoke(workspaceA.workspaceId, linkOfA.id, testbed.clock.now());
    });

    const [after] = await readInviteLinks(testbed, workspaceA.workspaceId);
    expect(after).toMatchObject({ role: WorkspaceRole.Operator, revokedAt: null });
  });

  it('shows nothing without a tenant', async () => {
    expect(await repository.findActive(workspaceA.workspaceId)).toBeNull();
  });
});
