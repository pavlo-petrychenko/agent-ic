import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { hashPassword } from '@/modules/identity/helpers/password.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { resetPasswordInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { ResetPasswordInput } from '@/modules/identity/typedefs/account.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly resets: PasswordResetsService,
    private readonly users: UsersRepository,
    private readonly sessions: SessionsService,
    private readonly clock: ClockService,
  ) {}

  async execute(_ctx: UseCaseCtx, input: ResetPasswordInput): Promise<void> {
    const { token, password } = parseAccountInput(resetPasswordInputSchema, input);
    await this.resets.requireUsable(token);
    const passwordHash = await hashPassword(password);
    await this.txHost.withTransaction(async () => {
      const record = await this.resets.consume(token);
      await this.users.updatePassword(record.userId, passwordHash, this.clock.now());
      await this.sessions.revokeAllForUser(record.userId);
    });
  }
}
