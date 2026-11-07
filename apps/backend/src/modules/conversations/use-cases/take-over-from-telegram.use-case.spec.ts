import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramTakeOverOutcomeKind } from '@/modules/conversations/constants/conversation-take-over.constants';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import type { ConversationView } from '@/modules/conversations/typedefs/simulation.typedefs';
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
  callbackQueryId: 'callback-1',
  locale: Locale.En,
};

const VIEW = {
  id: 'conversation-1',
  state: 'handled',
  channelKind: 'telegram',
  language: null,
  versionId: null,
  closeReason: null,
  closedAt: null,
  createdAt: new Date('2026-11-07T21:00:00.000Z'),
} as unknown as ConversationView;

describe('TakeOverFromTelegramUseCase', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const findRole = vi.fn<MembershipsRepository['findRole']>();
  const takeOverForTelegram = vi.fn<ConversationTakeOverService['takeOverForTelegram']>();
  const telegram = new FakeTelegramGateway();
  let service: TakeOverFromTelegramUseCase;

  beforeEach(() => {
    run.mockReset();
    findRole.mockReset();
    takeOverForTelegram.mockReset();
    telegram.answerCallbackQueryCalls.length = 0;
    telegram.removeInlineKeyboardCalls.length = 0;
    run.mockImplementation((_workspaceId, work) => work());
    findRole.mockResolvedValue(WorkspaceRole.Operator);
    takeOverForTelegram.mockResolvedValue({
      kind: TelegramTakeOverOutcomeKind.TakenOver,
      conversation: VIEW,
    });
    service = new TakeOverFromTelegramUseCase(
      { run } as unknown as TenantTransactionService,
      { findRole } as unknown as MembershipsRepository,
      { takeOverForTelegram } as unknown as ConversationTakeOverService,
      {
        config: { telegram: { alertsBotToken: 'alerts-token' } },
      } as unknown as ConfigService,
      telegram,
    );
  });

  const execute = (overrides: Partial<typeof INPUT> = {}) =>
    service.execute(workspaceSystemCtx('workspace-1'), { ...INPUT, ...overrides });

  it('takes over as the linked user and removes the buttons', async () => {
    await execute();

    expect(findRole).toHaveBeenCalledWith('workspace-1', 'user-1');
    expect(takeOverForTelegram).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: { kind: ActorKind.User, userId: 'user-1' },
        workspaceId: 'workspace-1',
        workspaceRole: WorkspaceRole.Operator,
        clientIp: null,
      }),
      expect.objectContaining({
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: WorkspaceRole.Operator,
      }),
      'cnv_public',
    );
    expect(telegram.answerCallbackQueryCalls).toEqual([
      {
        token: 'alerts-token',
        callbackQueryId: 'callback-1',
        text: 'Chat taken over. Open it in the Inbox to reply.',
        showAlert: false,
      },
    ]);
    expect(telegram.removeInlineKeyboardCalls).toEqual([
      { token: 'alerts-token', chatId: '42', messageId: '7' },
    ]);
  });

  it('tells the same operator that the chat is already theirs', async () => {
    takeOverForTelegram.mockResolvedValue({ kind: TelegramTakeOverOutcomeKind.SameUser });

    await execute();

    expect(telegram.answerCallbackQueryCalls[0]).toMatchObject({
      text: 'You already have this chat.',
      showAlert: true,
    });
    expect(telegram.removeInlineKeyboardCalls).toHaveLength(1);
  });

  it('names the operator who already took the chat', async () => {
    takeOverForTelegram.mockResolvedValue({
      kind: TelegramTakeOverOutcomeKind.OtherUser,
      name: 'Olena',
    });

    await execute();

    expect(telegram.answerCallbackQueryCalls[0]).toMatchObject({
      text: 'This chat is already taken over by Olena.',
      showAlert: true,
    });
  });

  it('tells the operator when the chat is closed', async () => {
    takeOverForTelegram.mockResolvedValue({ kind: TelegramTakeOverOutcomeKind.Closed });

    await execute();

    expect(telegram.answerCallbackQueryCalls[0]).toMatchObject({
      text: 'This chat is closed.',
      showAlert: true,
    });
  });

  it('answers in Ukrainian', async () => {
    await execute({ locale: Locale.Uk });

    expect(telegram.answerCallbackQueryCalls[0]?.text).toBe(
      'Чат взято. Відкрийте його у Вхідних, щоб відповісти.',
    );
  });

  it('answers when the user is no longer a member', async () => {
    findRole.mockResolvedValue(null);

    await execute();

    expect(takeOverForTelegram).not.toHaveBeenCalled();
    expect(telegram.answerCallbackQueryCalls[0]).toMatchObject({
      text: 'This chat can no longer be taken over.',
      showAlert: true,
    });
  });
});
