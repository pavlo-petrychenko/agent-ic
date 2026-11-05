import { Body, Controller, Headers, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import {
  API_CHANNEL_ID_PARAM,
  API_CHANNEL_MESSAGES_PATH,
} from '@/modules/channels/constants/api-channel.constants';
import { ApiChannelReplyStatus } from '@/modules/channels/constants/channel.constants';
import { ApiChannelKeyGuard } from '@/modules/channels/guards/api-channel-key.guard';
import { toApiChannelMessageResponse } from '@/modules/channels/helpers/api-channel-reply.helpers';
import type {
  ApiChannelMessageResult,
  ApiChannelMessageResponse,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import { HandleApiChannelMessageUseCase } from '@/modules/channels/use-cases/handle-api-channel-message.use-case';
import { HttpCtx } from '@/platform/context/decorators/http-ctx.decorator';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Controller(API_CHANNEL_MESSAGES_PATH)
export class ApiChannelMessagesController {
  constructor(private readonly handleMessage: HandleApiChannelMessageUseCase) {}

  @Post(`:${API_CHANNEL_ID_PARAM}/messages`)
  @UseGuards(ApiChannelKeyGuard)
  async receive(
    @HttpCtx() ctx: UseCaseCtx,
    @Body() body: unknown,
    @Headers(HttpHeader.IdempotencyKey) idempotencyKey: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiChannelMessageResponse> {
    const result = await this.handleMessage.execute(ctx, {
      body,
      idempotencyKey: idempotencyKey ?? null,
    });
    this.setStatus(result, response);
    return toApiChannelMessageResponse(result);
  }

  private setStatus(result: ApiChannelMessageResult, response: Response): void {
    const pending = result.reply === null || result.reply.status === ApiChannelReplyStatus.Pending;
    response.status(pending ? HttpStatus.ACCEPTED : HttpStatus.OK);
  }
}
