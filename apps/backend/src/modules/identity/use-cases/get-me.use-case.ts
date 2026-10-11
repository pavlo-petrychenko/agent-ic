import { Injectable } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { MeService } from '@/modules/identity/services/me.service';
import type { Me } from '@/modules/identity/typedefs/user.typedefs';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { requireUserActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class GetMeUseCase {
  constructor(
    private readonly users: UsersRepository,
    private readonly me: MeService,
  ) {}

  async execute(ctx: UseCaseCtx): Promise<Me> {
    const actor = requireUserActor(ctx);
    const user = await this.users.findById(actor.userId);
    if (user === null) {
      throw new AuthenticationRequiredError();
    }
    return this.me.describe(user);
  }
}
