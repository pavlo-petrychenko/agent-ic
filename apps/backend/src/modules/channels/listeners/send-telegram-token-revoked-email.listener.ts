import { Injectable } from '@nestjs/common';
import type { TelegramTokenRevokedInput } from '@/modules/channels/events/telegram-token-revoked.event';
import { sendTelegramTokenRevokedEmailJob } from '@/modules/channels/jobs/send-telegram-token-revoked-email.job';
import { SendTelegramTokenRevokedEmailUseCase } from '@/modules/channels/use-cases/send-telegram-token-revoked-email.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(sendTelegramTokenRevokedEmailJob)
export class SendTelegramTokenRevokedEmailListener implements JobHandler<TelegramTokenRevokedInput> {
  constructor(
    private readonly sendTelegramTokenRevokedEmail: SendTelegramTokenRevokedEmailUseCase,
  ) {}

  handle(ctx: UseCaseCtx, data: TelegramTokenRevokedInput): Promise<void> {
    return this.sendTelegramTokenRevokedEmail.execute(ctx, data);
  }
}
