import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotContentProps {
  readonly workspaceId: string;
  readonly channel: TelegramChannelView;
  readonly agentOptions: readonly SelectOption[];
}

export interface UseTelegramBotContentResult {
  readonly channelsLink: string;
  readonly botUsername: string;
  readonly agentName: string;
  readonly agentId: string;
  readonly typing: boolean;
  readonly saving: boolean;
  readonly disconnectOpen: boolean;
  readonly disconnecting: boolean;
  readonly disconnectError: string | null;
  readonly reconnecting: boolean;
  readonly refreshing: boolean;
  readonly replaceOpen: boolean;
  readonly replacing: boolean;
  readonly replaceToken: string;
  readonly replaceTokenError: string | null;
  readonly replaceError: string | null;
  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly deleteError: string | null;
  readonly typedName: string;
  readonly deleteConfirmed: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onTypingChange: (checked: boolean) => void;
  readonly onSave: () => void;
  readonly onReplaceToken: () => void;
  readonly onReplaceTokenChange: (value: string) => void;
  readonly onReplaceOpenChange: (open: boolean) => void;
  readonly onReplaceCancel: () => void;
  readonly onReplaceConfirm: () => void;
  readonly onDisconnect: () => void;
  readonly onDisconnectOpenChange: (open: boolean) => void;
  readonly onDisconnectCancel: () => void;
  readonly onDisconnectConfirm: () => void;
  readonly onReconnect: () => void;
  readonly onRefreshIdentity: () => void;
  readonly onDelete: () => void;
  readonly onDeleteOpenChange: (open: boolean) => void;
  readonly onDeleteCancel: () => void;
  readonly onTypedNameChange: (value: string) => void;
  readonly onDeleteConfirm: () => void;
}
