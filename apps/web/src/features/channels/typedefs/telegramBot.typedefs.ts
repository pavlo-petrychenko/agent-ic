export enum TelegramBotStatus {
  Connected = 'connected',
  Revoked = 'revoked',
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
