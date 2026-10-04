import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly workspaceMemberships: WorkspaceMembershipsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<Me> {
    const actor = requireUserActor(ctx);
    const user = await this.users.findById(actor.userId);
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
  }
}
