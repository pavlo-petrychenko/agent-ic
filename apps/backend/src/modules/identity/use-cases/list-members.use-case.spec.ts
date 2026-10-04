import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ListMembersUseCase } from '@/modules/identity/use-cases/list-members.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_USER_NAME } from '@test/support/constants/identity-testing.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMember,
  createOwnedWorkspace,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const PAGE_SIZE = 2;

describe('ListMembersUseCase', () => {
  let testbed: IdentityTestbed;
  let listMembers: ListMembersUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    listMembers = testbed.module.get(ListMembersUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('pages through every member with a total count', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const memberIds = [await addMember(testbed, workspace), await addMember(testbed, workspace)];

    const first = await listMembers.execute(ownerCtx(workspace), { first: PAGE_SIZE });
    const second = await listMembers.execute(ownerCtx(workspace), {
      first: PAGE_SIZE,
      after: first.members.pageInfo.endCursor,
    });

    const ids = testbed.module.get(IdService);
    const nodes = [...first.members.edges, ...second.members.edges].map((edge) => edge.node);
    expect(first.totalCount).toBe(3);
    expect(first.members.pageInfo.hasNextPage).toBe(true);
    expect(second.members.pageInfo.hasNextPage).toBe(false);
    expect(new Set(nodes.map((node) => node.userId))).toEqual(
      new Set(
        [workspace.ownerId, ...memberIds].map((userId) => ids.toPublic(IdPrefix.User, userId)),
      ),
    );
    expect(nodes.find((node) => node.role === WorkspaceRole.Owner)).toMatchObject({
      id: expect.stringMatching(new RegExp(`^${IdPrefix.Membership}_`)),
      name: TEST_USER_NAME,
      lastActiveAt: testbed.clock.now(),
    });
  });

  it('never shows workspace B the members of workspace A', async () => {
    const workspaceA = await createOwnedWorkspace(testbed);
    await addMember(testbed, workspaceA);
    const workspaceB = await createOwnedWorkspace(testbed);

    const seenByB = await listMembers.execute(ownerCtx(workspaceB), {});

    const ids = testbed.module.get(IdService);
    expect(seenByB.totalCount).toBe(1);
    expect(seenByB.members.edges.map((edge) => edge.node.userId)).toEqual([
      ids.toPublic(IdPrefix.User, workspaceB.ownerId),
    ]);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMember(testbed, workspace);

    const attempt = listMembers.execute(
      workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
      {},
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
