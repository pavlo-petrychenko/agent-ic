import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import type {
  GetTelegramUpdatesInput,
  SendTelegramChatActionInput,
  SendTelegramMessageInput,
  SetTelegramWebhookInput,
  TelegramBot,
  TelegramUpdate,
  TelegramWebhookInfo,
} from '@/modules/channels/typedefs/telegram.typedefs';

export class FakeTelegramGateway extends TelegramGateway {
  bot: TelegramBot = { id: '1', username: 'test_bot', firstName: 'Test Bot' };
  webhookInfo: TelegramWebhookInfo = {
    url: '',
    pendingUpdateCount: 0,
    lastErrorAt: null,
    lastErrorMessage: null,
  };
  updates: TelegramUpdate[] = [];
  readonly getMeCalls: string[] = [];
  readonly setWebhookCalls: SetTelegramWebhookInput[] = [];
  readonly deleteWebhookCalls: string[] = [];
  readonly getWebhookInfoCalls: string[] = [];
  readonly getUpdatesCalls: GetTelegramUpdatesInput[] = [];
  readonly sendMessageCalls: SendTelegramMessageInput[] = [];
  readonly sendChatActionCalls: SendTelegramChatActionInput[] = [];
  private readonly failures: Error[] = [];

  failNext(error: Error): void {
    this.failures.push(error);
  }

  getMe(token: string): Promise<TelegramBot> {
    this.getMeCalls.push(token);
    return this.respond(this.bot);
  }

  setWebhook(input: SetTelegramWebhookInput): Promise<void> {
    this.setWebhookCalls.push(input);
    this.webhookInfo = {
      ...this.webhookInfo,
      url: input.url,
      pendingUpdateCount: 0,
      lastErrorAt: null,
      lastErrorMessage: null,
    };
    return this.respond(undefined);
  }

  deleteWebhook(token: string): Promise<void> {
    this.deleteWebhookCalls.push(token);
    this.webhookInfo = {
      ...this.webhookInfo,
      url: '',
      pendingUpdateCount: 0,
      lastErrorAt: null,
      lastErrorMessage: null,
    };
    return this.respond(undefined);
  }

  getWebhookInfo(token: string): Promise<TelegramWebhookInfo> {
    this.getWebhookInfoCalls.push(token);
    return this.respond(this.webhookInfo);
  }

  getUpdates(input: GetTelegramUpdatesInput): Promise<TelegramUpdate[]> {
    this.getUpdatesCalls.push(input);
    return this.respond(this.updates.splice(0));
  }

  sendMessage(input: SendTelegramMessageInput): Promise<void> {
    this.sendMessageCalls.push(input);
    return this.respond(undefined);
  }

  sendChatAction(input: SendTelegramChatActionInput): Promise<void> {
    this.sendChatActionCalls.push(input);
    return this.respond(undefined);
  }

  private async respond<TResult>(result: TResult): Promise<TResult> {
    const failure = this.failures.shift();
    if (failure !== undefined) {
      throw failure;
    }
    return result;
  }
}
