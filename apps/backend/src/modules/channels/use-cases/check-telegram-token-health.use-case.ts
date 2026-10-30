import { Injectable } from '@nestjs/common';
import { TelegramTokenHealthService } from '@/modules/channels/services/telegram-token-health.service';
import type { TelegramTokenHealthResult } from '@/modules/channels/typedefs/telegram.typedefs';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class CheckTelegramTokenHealthUseCase {
  constructor(private readonly health: TelegramTokenHealthService) {}

  async execute(ctx: UseCaseCtx): Promise<TelegramTokenHealthResult> {
    requireSystemActor(ctx);
    return this.health.checkConnected();
  }
}
