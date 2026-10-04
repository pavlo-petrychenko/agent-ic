import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { RESEND_CONFIRMATION_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { emailConfirmationRequestedEvent } from '@/modules/identity/events/email-confirmation-requested.event';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { resendConfirmationInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import type { ResendConfirmationInput } from '@/modules/identity/typedefs/account.typedefs';
import type { UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ResendConfirmationUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly confirmations: EmailConfirmationsService,
    private readonly users: UsersRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ResendConfirmationInput): Promise<void> {
    const data = parseAccountInput(resendConfirmationInputSchema, input);
    await this.rateLimits.enforce(
      RESEND_CONFIRMATION_RATE_LIMIT,
      data.email === null ? this.secureTokens.hash(data.token) : data.email,
    );
    await this.txHost.withTransaction(async () => {
      const user =
        data.email === null
          ? await this.findByToken(data.token)
          : await this.users.findByEmail(data.email);
      if (user !== null && user.emailConfirmedAt === null) {
        await this.domainEvents.emit(ctx, emailConfirmationRequestedEvent, { userId: user.id });
      }
    });
  }

  private async findByToken(token: string): Promise<UserRecord | null> {
    const record = await this.confirmations.findToken(token);
    return record === null ? null : this.users.findById(record.userId);
  }
}
