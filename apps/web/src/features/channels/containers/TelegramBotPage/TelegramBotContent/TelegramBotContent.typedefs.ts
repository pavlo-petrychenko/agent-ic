import type { TelegramChannelView } from '@/features/channels/typedefs/telegram.typedefs';
import type { SelectOption } from '@/shared/ui/inputs/Select';

export interface TelegramBotContentProps {
  readonly workspaceId: string;
  readonly channel: TelegramChannelView;
  readonly agentOptions: readonly SelectOption[];
}

export interface TelegramBotContentHeader {
  readonly channelsLink: string;
  readonly botUsername: string;
  readonly agentName: string;
}

export interface TelegramBotSettingsResult {
  readonly agentId: string;
  readonly typing: boolean;
  readonly saving: boolean;
  readonly onAgentChange: (value: string) => void;
  readonly onTypingChange: (checked: boolean) => void;
  readonly onSave: () => void;
}

export interface TelegramBotDisconnectResult {
  readonly disconnectOpen: boolean;
  readonly disconnecting: boolean;
  readonly disconnectError: string | null;
  readonly onDisconnect: () => void;
  readonly onDisconnectOpenChange: (open: boolean) => void;
  readonly onDisconnectCancel: () => void;
  readonly onDisconnectConfirm: () => void;
}

export interface TelegramBotActionsResult {
  readonly reconnecting: boolean;
  readonly refreshing: boolean;
  readonly onReconnect: () => void;
  readonly onRefreshIdentity: () => void;
}

export interface TelegramBotReplaceTokenResult {
  readonly replaceOpen: boolean;
  readonly replacing: boolean;
  readonly replaceToken: string;
  readonly replaceTokenError: string | null;
  readonly replaceError: string | null;
  readonly onReplaceToken: () => void;
  readonly onReplaceTokenChange: (value: string) => void;
  readonly onReplaceOpenChange: (open: boolean) => void;
  readonly onReplaceCancel: () => void;
  readonly onReplaceConfirm: () => void;
}

export interface TelegramBotDeleteResult {
  readonly deleteOpen: boolean;
  readonly deleting: boolean;
  readonly deleteError: string | null;
  readonly typedName: string;
  readonly deleteConfirmed: boolean;
  readonly onDelete: () => void;
  readonly onDeleteOpenChange: (open: boolean) => void;
  readonly onDeleteCancel: () => void;
  readonly onTypedNameChange: (value: string) => void;
  readonly onDeleteConfirm: () => void;
}

export type UseTelegramBotContentResult = TelegramBotContentHeader &
  TelegramBotSettingsResult &
  TelegramBotDisconnectResult &
  TelegramBotActionsResult &
  TelegramBotReplaceTokenResult &
  TelegramBotDeleteResult;
