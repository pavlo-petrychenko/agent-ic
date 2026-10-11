import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { updateMyNameInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { MeService } from '@/modules/identity/services/me.service';
import type { UpdateMyNameInput } from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class UpdateMyNameUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly users: UsersRepository,
    private readonly me: MeService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateMyNameInput): Promise<Me> {
    const actor = requireUserActor(ctx);
    const { name } = parseAccountInput(updateMyNameInputSchema, input);

    return this.txHost.withTransaction(async () => {
      const user = await this.users.updateName(actor.userId, name);
      if (user === null) {
        throw new AuthenticationRequiredError();
      }
      return this.me.describe(user);
    });
  }
}
