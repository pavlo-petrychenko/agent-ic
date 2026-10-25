export enum TelegramBotStatus {
  Connected = 'connected',
  Revoked = 'revoked',
}

export enum TelegramChannelStatus {
  Pending = 'pending',
  Connected = 'connected',
  Broken = 'broken',
  Disconnected = 'disconnected',
}

export interface TelegramChannelSummary {
  readonly id: string;
  readonly displayName: string;
  readonly status: TelegramChannelStatus;
  readonly agentId: string | null;
  readonly agentName: string | null;
}

export interface TelegramChannelView extends TelegramChannelSummary {
  readonly firstName: string | null;
  readonly agentLiveVersionNumber: number | null;
  readonly showTyping: boolean;
  readonly updatedAt: string;
}

export interface ConnectTelegramVariables {
  readonly token: string;
  readonly agentId: string;
  readonly showTyping: boolean;
}

export interface UseConnectTelegramResult {
  readonly connectTelegram: (variables: ConnectTelegramVariables) => Promise<string>;
  readonly connecting: boolean;
}

export interface UseDisconnectTelegramResult {
  readonly disconnectTelegram: (id: string) => Promise<void>;
  readonly disconnecting: boolean;
}

export interface TelegramBotStats {
  readonly chats: string;
  readonly messages: string;
  readonly errors: string;
}

export interface TelegramBotMock {
  readonly id: string;
  readonly username: string;
  readonly agentId: string;
  readonly agentName: string;
  readonly status: TelegramBotStatus;
  readonly tokenMasked: string;
  readonly lastUpdateTime: string;
  readonly lastUpdateAuthor: string;
  readonly lastUpdateDate: string;
  readonly botName: string | null;
  readonly revokedTime: string | null;
  readonly publishedVersion: number | null;
  readonly agentIsDraft: boolean;
  readonly typingIndicator: boolean;
  readonly stats: TelegramBotStats | null;
}
