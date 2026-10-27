import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import type {
  SetTelegramWebhookInput,
  TelegramBot,
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
  readonly getMeCalls: string[] = [];
  readonly setWebhookCalls: SetTelegramWebhookInput[] = [];
  readonly deleteWebhookCalls: string[] = [];
  readonly getWebhookInfoCalls: string[] = [];
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

  private async respond<TResult>(result: TResult): Promise<TResult> {
    const failure = this.failures.shift();
    if (failure !== undefined) {
      throw failure;
    }
    return result;
  }
}
