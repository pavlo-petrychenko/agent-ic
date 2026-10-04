import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlUser } from '@/modules/identity/helpers/account-graphql.helpers';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { User } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class MeResolver {
  constructor(private readonly getMeUseCase: GetMeUseCase) {}

  @Query()
  async me(@GraphqlCtx() ctx: UseCaseCtx): Promise<User> {
    return toGraphqlUser(await this.getMeUseCase.execute(ctx));
  }
}
