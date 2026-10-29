import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  TELEGRAM_WEBHOOK_CHANNEL_PARAM as webhookChannel,
  TELEGRAM_WEBHOOK_PATH as webhookPath,
  TELEGRAM_WEBHOOK_WORKSPACE_PARAM as webhookWorkspace,
} from '@/modules/channels/constants/telegram.constants';
import { HandleTelegramWebhookUseCase } from '@/modules/channels/use-cases/handle-telegram-webhook.use-case';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Controller(webhookPath)
export class TelegramWebhookController {
  constructor(private readonly handleWebhook: HandleTelegramWebhookUseCase) {}

  @Post(`:${webhookWorkspace}/:${webhookChannel}`)
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param(webhookWorkspace) workspaceId: string,
    @Param(webhookChannel) channelId: string,
    @Headers(HttpHeader.TelegramSecretToken) secret: string | undefined,
    @Body() body: unknown,
  ): Promise<{ readonly ok: true }> {
    await this.handleWebhook.execute({
      workspacePublicId: workspaceId,
      channelPublicId: channelId,
      secret: secret ?? null,
      body,
    });
    return { ok: true };
  }
}
