import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import { createOwnedWorkspace } from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

describe('WorkspacesRepository across tenants', () => {
  let testbed: IdentityTestbed;
  let repository: WorkspacesRepository;
  let tenants: TenantTransactionService;
  let workspaceA: TestWorkspace;
  let workspaceB: TestWorkspace;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    repository = testbed.module.get(WorkspacesRepository);
    tenants = testbed.module.get(TenantTransactionService);
    workspaceA = await createOwnedWorkspace(testbed);
    workspaceB = await createOwnedWorkspace(testbed);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('shows a workspace only inside its own tenant', async () => {
    const ownFromB = await tenants.run(workspaceB.workspaceId, () =>
      repository.findById(workspaceB.workspaceId),
    );
    const aFromB = await tenants.run(workspaceB.workspaceId, () =>
      repository.findById(workspaceA.workspaceId),
    );

    expect(ownFromB?.id).toBe(workspaceB.workspaceId);
    expect(aFromB).toBeNull();
  });

  it('shows nothing without a tenant', async () => {
    expect(await repository.findById(workspaceA.workspaceId)).toBeNull();
  });
});
