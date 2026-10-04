import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { isPast } from '@/modules/identity/helpers/time.helpers';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { confirmEmailInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { ConfirmEmailInput } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession } from '@/modules/identity/typedefs/session.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly confirmations: EmailConfirmationsService,
    private readonly emailTokens: EmailTokensRepository,
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly invites: InviteLinksService,
    private readonly clock: ClockService,
  ) {}

  async execute(_ctx: UseCaseCtx, input: ConfirmEmailInput): Promise<IssuedSession> {
    const { token } = parseAccountInput(confirmEmailInputSchema, input);
    return this.txHost.withTransaction(async () => {
      const now = this.clock.now();
      const record = await this.confirmations.findToken(token);
      if (record === null || record.usedAt !== null) {
        throw new TokenInvalidError();
      }
      if (isPast(record.expiresAt, now)) {
        throw new TokenExpiredError();
      }
      if (!(await this.emailTokens.markUsed(record.id, now))) {
        throw new TokenInvalidError();
      }
      await this.users.markEmailConfirmed(record.userId, now);
      await this.users.touchLastActive(record.userId, now);
      await this.invites.completePending(record.userId);
      return this.sessions.start(record.userId);
    });
  }
}
