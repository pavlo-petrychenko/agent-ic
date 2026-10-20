import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { CHANGE_PASSWORD_RATE_LIMIT } from '@/modules/identity/constants/rate-limit.constants';
import { SamePasswordError } from '@/modules/identity/errors/same-password.error';
import { WrongPasswordError } from '@/modules/identity/errors/wrong-password.error';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { hashPassword, verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { changeMyPasswordInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { MeService } from '@/modules/identity/services/me.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { ChangeMyPasswordInput } from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly rateLimits: RateLimitService,
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly me: MeService,
  ) {}

  async execute(ctx: UseCaseCtx, input: ChangeMyPasswordInput): Promise<Me> {
    const actor = requireUserActor(ctx);
    const { currentPassword, newPassword } = parseAccountInput(changeMyPasswordInputSchema, input);
    await this.rateLimits.enforce(CHANGE_PASSWORD_RATE_LIMIT, actor.userId);
    const passwordHash = await hashPassword(newPassword);
    return this.txHost.withTransaction(async () => {
      const user = await this.users.findById(actor.userId);
      if (user === null) {
        throw new AuthenticationRequiredError();
      }
      if (!(await verifyPassword(user.passwordHash, currentPassword))) {
        throw new WrongPasswordError();
      }
      if (await verifyPassword(user.passwordHash, newPassword)) {
        throw new SamePasswordError();
      }
      await this.users.updatePassword(user.id, passwordHash);
      await this.sessions.revokeAllForUser(user.id);
      return this.me.describe(user);
    });
  }
}
