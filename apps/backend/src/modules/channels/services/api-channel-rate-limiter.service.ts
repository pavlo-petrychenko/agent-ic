import { Injectable } from '@nestjs/common';
import {
  API_CHANNEL_CLIENT_MESSAGE_RATE_LIMIT,
  API_CHANNEL_MESSAGE_RATE_LIMIT,
  API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT,
} from '@/modules/channels/constants/api-channel-rate-limit.constants';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ApiChannelRateLimiterService {
  constructor(private readonly rateLimits: RateLimitService) {}

  async enforce(ctx: UseCaseCtx, workspaceId: string, channelId: string): Promise<void> {
    await this.rateLimits.enforce(API_CHANNEL_WORKSPACE_MESSAGE_RATE_LIMIT, workspaceId);
    if (ctx.clientIp !== null) {
      await this.rateLimits.enforce(API_CHANNEL_CLIENT_MESSAGE_RATE_LIMIT, ctx.clientIp);
    }
    await this.rateLimits.enforce(API_CHANNEL_MESSAGE_RATE_LIMIT, channelId);
  }
}
