import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { PASSWORD_RESET_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { passwordResetRequestedEvent } from '@/modules/identity/events/password-reset-requested.event';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { forgotPasswordInputSchema } from '@/modules/identity/schemas/account-input.schema';
import type { ForgotPasswordInput } from '@/modules/identity/typedefs/account.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ForgotPasswordInput): Promise<void> {
    const { email } = parseAccountInput(forgotPasswordInputSchema, input);
    await this.rateLimits.enforce(PASSWORD_RESET_RATE_LIMIT, email);
    await this.txHost.withTransaction(async () => {
      const user = await this.users.findByEmail(email);
      if (user !== null && user.emailConfirmedAt !== null) {
        await this.domainEvents.emit(ctx, passwordResetRequestedEvent, { userId: user.id });
      }
    });
  }
}
