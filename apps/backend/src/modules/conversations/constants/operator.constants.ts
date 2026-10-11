import { PermissionResource } from '@agent-ic/contracts';
import { ConversationMode } from '@/modules/conversations/constants/conversation.constants';

export const OPERATOR_RESOURCE: Readonly<Record<ConversationMode, PermissionResource>> = {
  [ConversationMode.Live]: PermissionResource.Inbox,
  [ConversationMode.Simulation]: PermissionResource.Testing,
};

export const OPERATOR_MESSAGE_KEY_PREFIX = 'operator';

export const OPERATOR_MESSAGE_KEY_SEPARATOR = ':';
