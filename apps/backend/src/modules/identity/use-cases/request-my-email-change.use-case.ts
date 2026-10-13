import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { EMAIL_CHANGE_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { emailChangeRequestedEvent } from '@/modules/identity/events/email-change-requested.event';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { requestMyEmailChangeInputSchema } from '@/modules/identity/schemas/account-input.schema';
import type { RequestMyEmailChangeInput } from '@/modules/identity/typedefs/account.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class RequestMyEmailChangeUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RequestMyEmailChangeInput): Promise<void> {
    const actor = requireUserActor(ctx);
    const { email } = parseAccountInput(requestMyEmailChangeInputSchema, input);
    await this.rateLimits.enforce(EMAIL_CHANGE_RATE_LIMIT, actor.userId);
    await this.txHost.withTransaction(async () => {
      const user = await this.users.findById(actor.userId);
      if (user === null) {
        throw new AuthenticationRequiredError();
      }
      if (user.email === email) {
        await this.users.setPendingEmail(user.id, null);
        return;
      }
      const taken = await this.users.findByEmail(email);
      if (taken !== null) {
        throw new EmailTakenError();
      }
      await this.users.setPendingEmail(user.id, email);
      await this.domainEvents.emit(ctx, emailChangeRequestedEvent, { userId: actor.userId });
    });
  }
}
