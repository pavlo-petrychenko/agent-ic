import { Injectable } from '@nestjs/common';
import { telegramAlertTakeOverJob } from '@/modules/conversations/jobs/telegram-alert-take-over.job';
import { TakeOverFromTelegramUseCase } from '@/modules/conversations/use-cases/take-over-from-telegram.use-case';
import type { TelegramAlertTakeOverInput } from '@/modules/notifications';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(telegramAlertTakeOverJob)
export class TelegramAlertTakeOverListener implements JobHandler<TelegramAlertTakeOverInput> {
  constructor(private readonly takeOver: TakeOverFromTelegramUseCase) {}

  handle(ctx: UseCaseCtx, data: TelegramAlertTakeOverInput): Promise<void> {
    return this.takeOver.execute(ctx, data);
  }
}
