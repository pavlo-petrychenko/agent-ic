import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

const ROW_LEVEL_SECURITY_VIOLATION = { cause: { code: '42501' } };
const PAGE_LIMIT = 10;

describe('MembershipsRepository across tenants', () => {
  let testbed: IdentityTestbed;
  let repository: MembershipsRepository;
  let tenants: TenantTransactionService;
  let workspaceA: TestWorkspace;
  let workspaceB: TestWorkspace;
  let memberOfA: string;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    repository = testbed.module.get(MembershipsRepository);
    tenants = testbed.module.get(TenantTransactionService);
    workspaceA = await createOwnedWorkspace(testbed);
    workspaceB = await createOwnedWorkspace(testbed);
    memberOfA = await addMember(testbed, workspaceA);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('never shows workspace B the members of workspace A', async () => {
    const seenFromB = await tenants.run(workspaceB.workspaceId, async () => ({
      page: await repository.listPage(workspaceA.workspaceId, null, PAGE_LIMIT),
      count: await repository.countByWorkspace(workspaceA.workspaceId),
      member: await repository.findByUser(workspaceA.workspaceId, memberOfA),
    }));
    const ownFromA = await tenants.run(workspaceA.workspaceId, () =>
      repository.listPage(workspaceA.workspaceId, null, PAGE_LIMIT),
    );

    expect(seenFromB).toEqual({ page: [], count: 0, member: null });
    expect(ownFromA.map((row) => row.userId).sort()).toEqual(
      [workspaceA.ownerId, memberOfA].sort(),
    );
  });

  it('shows nothing without a tenant', async () => {
    expect(await repository.findRole(workspaceA.workspaceId, workspaceA.ownerId)).toBeNull();
  });

  it('refuses to write a membership into another workspace', async () => {
    const write = tenants.run(workspaceB.workspaceId, () =>
      repository.insertIfAbsent({
        id: testbed.module.get(IdService).generate(),
        workspaceId: workspaceA.workspaceId,
        userId: workspaceB.ownerId,
        role: WorkspaceRole.Admin,
        inviteLinkId: null,
        createdAt: testbed.clock.now(),
      }),
    );

    await expect(write).rejects.toMatchObject(ROW_LEVEL_SECURITY_VIOLATION);
    expect(await readMemberships(testbed, workspaceA.workspaceId)).toHaveLength(2);
  });
});
