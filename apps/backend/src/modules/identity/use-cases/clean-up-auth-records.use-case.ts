import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { SPENT_EMAIL_TOKEN_RETENTION_SECONDS } from '@/modules/identity/constants/identity-job.constants';
import { addSeconds } from '@/modules/identity/helpers/time.helpers';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { SessionsRepository } from '@/modules/identity/repositories/sessions.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class CleanUpAuthRecordsUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly emailTokens: EmailTokensRepository,
    private readonly sessions: SessionsRepository,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<void> {
    requireSystemActor(ctx);
    await this.txHost.withTransaction(async () => {
      const now = this.clock.now();
      await this.emailTokens.deleteSpentBefore(
        addSeconds(now, -SPENT_EMAIL_TOKEN_RETENTION_SECONDS),
      );
      await this.sessions.deleteEnded(now);
    });
  }
}
