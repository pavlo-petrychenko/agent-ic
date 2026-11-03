import { Body, Controller, Headers, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  API_CHANNEL_ID_PARAM,
  API_CHANNEL_MESSAGES_PATH,
} from '@/modules/channels/constants/api-channel.constants';
import { ApiChannelKeyGuard } from '@/modules/channels/guards/api-channel-key.guard';
import { HandleApiChannelMessageUseCase } from '@/modules/channels/use-cases/handle-api-channel-message.use-case';
import { HttpCtx } from '@/platform/context/decorators/http-ctx.decorator';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Controller(API_CHANNEL_MESSAGES_PATH)
export class ApiChannelMessagesController {
  constructor(private readonly handleMessage: HandleApiChannelMessageUseCase) {}

  @Post(`:${API_CHANNEL_ID_PARAM}/messages`)
  @UseGuards(ApiChannelKeyGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async receive(
    @HttpCtx() ctx: UseCaseCtx,
    @Body() body: unknown,
    @Headers(HttpHeader.IdempotencyKey) idempotencyKey: string | undefined,
  ): Promise<{ readonly conversation_id: string }> {
    const result = await this.handleMessage.execute(ctx, {
      body,
      idempotencyKey: idempotencyKey ?? null,
    });
    return { conversation_id: result.conversationId };
  }
}
