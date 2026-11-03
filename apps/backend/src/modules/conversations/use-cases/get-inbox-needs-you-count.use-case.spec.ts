import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetInboxNeedsYouCountUseCase } from '@/modules/conversations/use-cases/get-inbox-needs-you-count.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import {
  createConversationsTestbed,
  seedConversation,
} from '@test/support/helpers/conversations-testing.helpers';
import { ensureUserRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

describe('GetInboxNeedsYouCountUseCase', () => {
  let testbed: ConversationsTestbed;

  const count = (workspaceId: string, userId: string, role = WorkspaceRole.Operator) =>
    testbed.module
      .get(GetInboxNeedsYouCountUseCase)
      .execute(workspaceCtx(userId, workspaceId, role));

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('counts every chat in the Needs you tab', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    const otherId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);
    await ensureUserRow(testbed.module, otherId);

    const waiting = await seedConversation(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.markWaiting(workspaceId, waiting.id),
    );
    const mine = await seedConversation(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.takeOver(workspaceId, mine.id, userId),
    );
    const someoneElse = await seedConversation(testbed, workspaceId);
    await testbed.tenants.run(workspaceId, () =>
      testbed.conversations.takeOver(workspaceId, someoneElse.id, otherId),
    );
    await seedConversation(testbed, workspaceId);

    expect(await count(workspaceId, userId)).toBe(3);
  });

  it('refuses a role without Inbox view', async () => {
    const workspaceId = testbed.ids.generate();
    const userId = testbed.ids.generate();
    await ensureUserRow(testbed.module, userId);

    await expect(count(workspaceId, userId, WorkspaceRole.Builder)).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });
});
