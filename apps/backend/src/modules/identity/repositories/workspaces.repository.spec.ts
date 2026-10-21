import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { CLOCK_TICK_MS } from '@test/support/constants/manual-clock.constants';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NEW_NAME,
} from '@test/support/constants/workspace-testing.constants';
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

describe('WorkspacesRepository timestamps', () => {
  let testbed: IdentityTestbed;
  let repository: WorkspacesRepository;
  let tenants: TenantTransactionService;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    repository = testbed.module.get(WorkspacesRepository);
    tenants = testbed.module.get(TenantTransactionService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('stamps both timestamps on insert and updatedAt on every update', async () => {
    testbed.clock.advanceBy(CLOCK_TICK_MS);
    const createdAt = testbed.clock.now();
    const { workspaceId } = await createOwnedWorkspace(testbed);
    const read = () => tenants.run(workspaceId, () => repository.findById(workspaceId));
    const inserted = await read();
    testbed.clock.advanceBy(CLOCK_TICK_MS);
    await tenants.run(workspaceId, () => repository.rename(workspaceId, TEST_WORKSPACE_NEW_NAME));
    const renamed = await read();
    testbed.clock.advanceBy(CLOCK_TICK_MS);
    await tenants.run(workspaceId, () => repository.updateTimeZone(workspaceId, TEST_TIME_ZONE));
    const moved = await read();

    expect(inserted).toMatchObject({ createdAt, updatedAt: createdAt });
    expect(renamed).toMatchObject({
      name: TEST_WORKSPACE_NEW_NAME,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + CLOCK_TICK_MS),
    });
    expect(moved).toMatchObject({ createdAt, updatedAt: testbed.clock.now() });
  });
});
