import { WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramTakeOverOutcomeKind } from '@/modules/conversations/constants/conversation-take-over.constants';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import { ConversationTimelineService } from '@/modules/conversations/services/conversation-timeline.service';
import { InboxActivityService } from '@/modules/conversations/services/inbox-activity.service';
import { OperatorConversationsService } from '@/modules/conversations/services/operator-conversations.service';
import { SimulationsService } from '@/modules/conversations/services/simulations.service';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { ConversationView } from '@/modules/conversations/typedefs/simulation.typedefs';
import { UsersRepository } from '@/modules/identity';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

const ACCESS = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: WorkspaceRole.Operator,
};

const CONVERSATION = {
  id: 'conversation-1',
  workspaceId: 'workspace-1',
  mode: ConversationMode.Live,
  state: ConversationState.AgentActive,
  handledBy: null,
} as unknown as Conversation;

const VIEW = { id: 'conversation-1' } as unknown as ConversationView;

describe('ConversationTakeOverService', () => {
  const run = vi.fn<(workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>>();
  const requireOperable = vi.fn<OperatorConversationsService['requireOperable']>();
  const takeOverIfUnhandled = vi.fn<ConversationsRepository['takeOverIfUnhandled']>();
  const findById = vi.fn<ConversationsRepository['findById']>();
  const findUser = vi.fn<UsersRepository['findById']>();
  const conversationChanged = vi.fn<InboxActivityService['conversationChanged']>();
  const record = vi.fn<ConversationTimelineService['record']>();
  const conversationView = vi.fn<SimulationsService['conversationView']>();
  let service: ConversationTakeOverService;

  beforeEach(() => {
    run.mockReset();
    requireOperable.mockReset();
    takeOverIfUnhandled.mockReset();
    findById.mockReset();
    findUser.mockReset();
    conversationChanged.mockReset();
    record.mockReset();
    conversationView.mockReset();
    run.mockImplementation((_workspaceId, work) => work());
    requireOperable.mockResolvedValue(CONVERSATION);
    takeOverIfUnhandled.mockResolvedValue({
      ...CONVERSATION,
      state: ConversationState.Handled,
      handledBy: 'user-1',
    });
    conversationChanged.mockResolvedValue(undefined);
    record.mockResolvedValue(undefined);
    conversationView.mockReturnValue(VIEW);
    service = new ConversationTakeOverService(
      { run } as unknown as TenantTransactionService,
      { requireOperable } as unknown as OperatorConversationsService,
      {
        takeOverIfUnhandled,
        findById,
      } as unknown as ConversationsRepository,
      { findById: findUser } as unknown as UsersRepository,
      { conversationChanged } as unknown as InboxActivityService,
      { record } as unknown as ConversationTimelineService,
      { conversationView } as unknown as SimulationsService,
    );
  });

  const takeOver = () => service.takeOverForTelegram(systemCtx(), ACCESS, 'cnv_public');

  it('takes over a waiting or agent chat', async () => {
    await expect(takeOver()).resolves.toEqual({
      kind: TelegramTakeOverOutcomeKind.TakenOver,
      conversation: VIEW,
    });

    expect(takeOverIfUnhandled).toHaveBeenCalledWith('workspace-1', 'conversation-1', 'user-1');
    expect(record).toHaveBeenCalled();
    expect(conversationChanged).toHaveBeenCalledWith('workspace-1', 'conversation-1');
  });

  it('reports a chat already handled by the same user', async () => {
    requireOperable.mockResolvedValue({
      ...CONVERSATION,
      state: ConversationState.Handled,
      handledBy: 'user-1',
    });

    await expect(takeOver()).resolves.toEqual({
      kind: TelegramTakeOverOutcomeKind.SameUser,
    });
    expect(takeOverIfUnhandled).not.toHaveBeenCalled();
  });

  it('names the operator who already handled the chat', async () => {
    requireOperable.mockResolvedValue({
      ...CONVERSATION,
      state: ConversationState.Handled,
      handledBy: 'user-2',
    });
    findUser.mockResolvedValue({
      id: 'user-2',
      name: 'Olena',
    } as unknown as Awaited<ReturnType<UsersRepository['findById']>>);

    await expect(takeOver()).resolves.toEqual({
      kind: TelegramTakeOverOutcomeKind.OtherUser,
      name: 'Olena',
    });
  });

  it('reports a closed chat', async () => {
    requireOperable.mockRejectedValue(new ConversationClosedError('cnv_public'));

    await expect(takeOver()).resolves.toEqual({
      kind: TelegramTakeOverOutcomeKind.Closed,
    });
  });

  it('reports the winner when another operator takes it first', async () => {
    takeOverIfUnhandled.mockResolvedValue(null);
    findById.mockResolvedValue({
      ...CONVERSATION,
      state: ConversationState.Handled,
      handledBy: 'user-2',
    });
    findUser.mockResolvedValue({
      id: 'user-2',
      name: 'Olena',
    } as unknown as Awaited<ReturnType<UsersRepository['findById']>>);

    await expect(takeOver()).resolves.toEqual({
      kind: TelegramTakeOverOutcomeKind.OtherUser,
      name: 'Olena',
    });
  });
});
