import { IdPrefix } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { parseAccountInput } from '@/modules/identity/helpers/account-input.helpers';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { updateMyLocaleInputSchema } from '@/modules/identity/schemas/account-input.schema';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { UpdateMyLocaleInput } from '@/modules/identity/typedefs/account.typedefs';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

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
