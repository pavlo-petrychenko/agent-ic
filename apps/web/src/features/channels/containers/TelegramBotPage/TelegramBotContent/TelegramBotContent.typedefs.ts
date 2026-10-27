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
  readonly replaceOpen: boolean;
  readonly replacing: boolean;
  readonly replaceToken: string;
  readonly replaceTokenError: string | null;
  readonly replaceError: string | null;
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
}
