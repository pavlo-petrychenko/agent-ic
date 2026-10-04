import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { SIGN_UP_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { emailConfirmationRequestedEvent } from '@/modules/identity/events/email-confirmation-requested.event';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { hashPassword } from '@/modules/identity/helpers/password.helpers';
import { clientSubject } from '@/modules/identity/helpers/rate-limit.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { signUpInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import type { SignUpInput, SignUpResult } from '@/modules/identity/typedefs/account.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly confirmations: EmailConfirmationsService,
    private readonly domainEvents: DomainEventsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SignUpInput): Promise<SignUpResult> {
    await this.rateLimits.enforce(SIGN_UP_RATE_LIMIT, clientSubject(ctx));
    const data = parseAccountInput(signUpInputSchema, input);
    const passwordHash = await hashPassword(data.password);
    return this.txHost.withTransaction(async () => {
      const now = this.clock.now();
      const user = await this.users.upsertUnconfirmed({
        id: this.ids.generate(),
        email: data.email,
        name: data.name,
        passwordHash,
        locale: data.locale,
        createdAt: now,
        updatedAt: now,
      });
      if (user === null) {
        throw new EmailTakenError();
      }
      await this.confirmations.invalidateOpenTokens(user.id);
      await this.domainEvents.emit(ctx, emailConfirmationRequestedEvent, { userId: user.id });
      return { email: user.email };
    });
  }
}
