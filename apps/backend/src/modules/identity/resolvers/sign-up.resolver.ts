import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toSignUpPayload } from '@/modules/identity/helpers/account-graphql.helpers';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  SignUpInput,
  SignUpPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class SignUpResolver {
  constructor(private readonly signUpUseCase: SignUpUseCase) {}

  @Mutation()
  async signUp(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: SignUpInput,
  ): Promise<SignUpPayload> {
    return toSignUpPayload(await this.signUpUseCase.execute(ctx, input));
  }
}
