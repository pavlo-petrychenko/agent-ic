import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TELEGRAM_ALERTS_WEBHOOK_PATH } from '@/modules/notifications/constants/notification.constants';
import { HandleTelegramAlertsUpdateUseCase } from '@/modules/notifications/use-cases/handle-telegram-alerts-update.use-case';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Controller(TELEGRAM_ALERTS_WEBHOOK_PATH)
export class TelegramAlertsController {
  constructor(private readonly handleUpdate: HandleTelegramAlertsUpdateUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Headers(HttpHeader.TelegramSecretToken) secret: string | undefined,
    @Body() body: unknown,
  ): Promise<{ readonly ok: true }> {
    await this.handleUpdate.execute({ secret, body });
    return { ok: true };
  }
}
