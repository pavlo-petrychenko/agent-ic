import {
  ChannelKind,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type { NewConversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import type { NewMessage } from '@/modules/conversations/typedefs/message.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import {
  TEST_END_USER_EXTERNAL_ID,
  TEST_MESSAGE_TEXT,
} from '@test/support/constants/conversations-testing.constants';
import { systemCtx } from '@test/support/fixtures/identity.fixture';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

export const newConversation = (
  testbed: ConversationsTestbed,
  workspaceId: string,
): NewConversation => ({
  id: testbed.ids.generate(),
  workspaceId,
  agentId: testbed.ids.generate(),
  mode: ConversationMode.Live,
  channelKind: ChannelKind.Simulated,
  endUserExternalId: TEST_END_USER_EXTERNAL_ID,
  state: ConversationState.AgentActive,
  lastMessageAt: testbed.clock.now(),
  createdAt: testbed.clock.now(),
});

export const newMessage = (
  testbed: ConversationsTestbed,
  conversation: NewConversation,
  overrides: Partial<NewMessage> = {},
): NewMessage => ({
  id: testbed.ids.generate(),
  workspaceId: conversation.workspaceId,
  conversationId: conversation.id,
  author: MessageAuthor.Customer,
  text: TEST_MESSAGE_TEXT,
  quickReplies: [],
  createdAt: testbed.clock.now(),
  ...overrides,
});

export const workspaceSystemCtx = (workspaceId: string): UseCaseCtx => ({
  ...systemCtx(),
  workspaceId,
});
