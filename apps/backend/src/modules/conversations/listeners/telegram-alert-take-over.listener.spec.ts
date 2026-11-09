import { Locale } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramAlertTakeOverListener } from '@/modules/conversations/listeners/telegram-alert-take-over.listener';
import { TakeOverFromTelegramUseCase } from '@/modules/conversations/use-cases/take-over-from-telegram.use-case';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';

const INPUT = {
  userId: 'user-1',
  conversationPublicId: 'cnv_public',
  chatId: '42',
  messageId: '7',
  callbackQueryId: 'callback-1',
  locale: Locale.En,
  inboxUrl: 'https://app.test/w/ws_public/inbox?conversation=cnv_public',
};

describe('TelegramAlertTakeOverListener', () => {
  const execute = vi.fn<TakeOverFromTelegramUseCase['execute']>();
  let listener: TelegramAlertTakeOverListener;

  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue(undefined);
    listener = new TelegramAlertTakeOverListener({
      execute,
    } as unknown as TakeOverFromTelegramUseCase);
  });

  it('delegates to the Telegram take-over use case', async () => {
    const ctx = workspaceSystemCtx('workspace-1');

    await listener.handle(ctx, INPUT);

    expect(execute).toHaveBeenCalledWith(ctx, INPUT);
  });
});
