import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { confirmEmailChangeInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { EmailChangesService } from '@/modules/identity/services/email-changes.service';
import type { ConfirmEmailChangeInput } from '@/modules/identity/typedefs/account.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly emailChanges: EmailChangesService,
    private readonly users: UsersRepository,
    private readonly clock: ClockService,
  ) {}

  async execute(_ctx: UseCaseCtx, input: ConfirmEmailChangeInput): Promise<void> {
    const { token } = parseAccountInput(confirmEmailChangeInputSchema, input);
    const record = await this.emailChanges.requireUsable(token);
    await this.txHost.withTransaction(async () => {
      const now = this.clock.now();
      const user = await this.users.findById(record.userId);
      const email = user?.pendingEmail ?? null;
      if (user === null || email === null) {
        throw new TokenInvalidError();
      }
      const taken = await this.users.findByEmail(email);
      if (taken !== null && taken.id !== user.id) {
        throw new EmailTakenError();
      }
      await this.emailChanges.consume(token);
      if (user.email !== email) {
        await this.users.updateEmail(user.id, email, now);
      }
    });
  }
}
