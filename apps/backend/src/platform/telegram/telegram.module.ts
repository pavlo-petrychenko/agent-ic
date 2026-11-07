import { Global, Module } from '@nestjs/common';
import { HttpTelegramGateway } from '@/platform/telegram/gateways/http-telegram.gateway';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';

@Global()
@Module({
  providers: [{ provide: TelegramGateway, useClass: HttpTelegramGateway }],
  exports: [TelegramGateway],
})
export class TelegramModule {}
