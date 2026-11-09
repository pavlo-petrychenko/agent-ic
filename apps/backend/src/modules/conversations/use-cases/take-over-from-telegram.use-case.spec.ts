import { WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import { TakeOverFromTelegramUseCase } from '@/modules/conversations/use-cases/take-over-from-telegram.use-case';
import { MembershipsRepository } from '@/modules/identity';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { FakeTelegramGateway } from '@/platform/telegram/gateways/telegram.fake';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';

const INPUT = {
  userId: 'user-1',
  conversationPublicId: 'cnv_public',
  chatId: '42',
  messageId: '7',
};

describe('TakeOverFromTelegramUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findRole = vi.fn<MembershipsRepository['findRole']>();
  const takeOver = vi.fn<ConversationTakeOverService['takeOver']>();
  const telegram = new FakeTelegramGateway();
  let service: TakeOverFromTelegramUseCase;

  beforeEach(() => {
    run.mockReset();
    findRole.mockReset();
    takeOver.mockReset();
    telegram.removeInlineKeyboardCalls.length = 0;
    run.mockImplementation((_workspaceId, work) => work());
    findRole.mockResolvedValue(WorkspaceRole.Operator);
    takeOver.mockResolvedValue({
      id: 'conversation-1',
      state: 'handled',
      channelKind: 'telegram',
      language: null,
      versionId: null,
      closeReason: null,
      closedAt: null,
      createdAt: new Date('2026-11-07T21:00:00.000Z'),
    } as unknown as Awaited<ReturnType<ConversationTakeOverService['takeOver']>>);
    service = new TakeOverFromTelegramUseCase(
      { run } as unknown as TenantTransactionService,
      { findRole } as unknown as MembershipsRepository,
      { takeOver } as unknown as ConversationTakeOverService,
      {
        config: { telegram: { alertsBotToken: 'alerts-token' } },
      } as unknown as ConfigService,
      telegram,
    );
  });

  it('takes over as the linked user and removes the buttons', async () => {
    await service.execute(workspaceSystemCtx('workspace-1'), INPUT);

    expect(findRole).toHaveBeenCalledWith('workspace-1', 'user-1');
    expect(takeOver).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { kind: ActorKind.User, userId: 'user-1' },
        workspaceId: 'workspace-1',
        workspaceRole: WorkspaceRole.Operator,
        clientIp: null,
      }),
      { userId: 'user-1', workspaceId: 'workspace-1', role: WorkspaceRole.Operator },
      'cnv_public',
    );
    expect(telegram.removeInlineKeyboardCalls).toEqual([
      { token: 'alerts-token', chatId: '42', messageId: '7' },
    ]);
  });

  it('does nothing when the user is no longer a member', async () => {
    findRole.mockResolvedValue(null);

    await service.execute(workspaceSystemCtx('workspace-1'), INPUT);

    expect(takeOver).not.toHaveBeenCalled();
    expect(telegram.removeInlineKeyboardCalls).toHaveLength(0);
  });
});
