import type { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import type { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { updateMyLocaleInputSchema } from '@/modules/identity/schemas/account-input.schema';
import type { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { UpdateMyLocaleInput } from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import type { ClockService } from '@/platform/clock/services/clock.service';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import type { IdService } from '@/platform/ids/services/id.service';
import { IdPrefix } from '@contracts/index';

@Injectable()
export class UpdateMyLocaleUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly users: UsersRepository,
    private readonly workspaceMemberships: WorkspaceMembershipsService,
    private readonly ids: IdService,
    private readonly clock: ClockService,
  ) {}

  async execute(ctx: UseCaseCtx, input: UpdateMyLocaleInput): Promise<Me> {
    const actor = requireUserActor(ctx);
    const { locale } = parseAccountInput(updateMyLocaleInputSchema, input);

    return this.txHost.withTransaction(async () => {
      const user = await this.users.updateLocale(actor.userId, locale, this.clock.now());
      if (user === null) {
        throw new AuthenticationRequiredError();
      }

      return {
        id: this.ids.toPublic(IdPrefix.User, user.id),
        email: user.email,
        name: user.name,
        locale: user.locale,
        memberships: await this.workspaceMemberships.listFor(user.id),
      };
    });
  }
}
