import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { LOGIN_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { EmailNotConfirmedError } from '@/modules/identity/errors/email-not-confirmed.error';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { loginSubject } from '@/modules/identity/helpers/rate-limit.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { loginInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { LoginInput } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession } from '@/modules/identity/typedefs/session.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, input: LoginInput): Promise<IssuedSession> {
    const data = parseAccountInput(loginInputSchema, input);
    await this.rateLimits.enforce(LOGIN_RATE_LIMIT, loginSubject(ctx, data.email));
    return this.txHost.withTransaction(async () => {
      const user = await this.users.findByEmail(data.email);
      const matches = await verifyPassword(user?.passwordHash ?? null, data.password);
      if (user === null || !matches) {
        throw new InvalidCredentialsError();
      }
      if (user.emailConfirmedAt === null) {
        throw new EmailNotConfirmedError();
      }
      await this.users.touchLastActive(user.id, this.clock.now());
      return this.sessions.start(user.id);
    });
  }
}
