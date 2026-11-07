import { Injectable } from '@nestjs/common';
import { TelegramLinkRepository } from '@/modules/notifications/repositories/telegram-link.repository';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class ClearExpiredTelegramLinksUseCase {
  constructor(private readonly links: TelegramLinkRepository) {}

  async execute(ctx: UseCaseCtx): Promise<number> {
    requireSystemActor(ctx);
    return this.links.clearExpired();
  }
}
