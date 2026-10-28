import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { CreateGooglePickerSessionUseCase } from '@/modules/knowledge/use-cases/create-google-picker-session.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { GooglePickerSession } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgePickerResolver {
  constructor(private readonly createSessionUseCase: CreateGooglePickerSessionUseCase) {}

  @Mutation()
  async createGooglePickerSession(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.ConnectionId) connectionId: string,
  ): Promise<GooglePickerSession> {
    const session = await this.createSessionUseCase.execute(ctx, connectionId);
    return {
      accessToken: session.accessToken,
      apiKey: session.apiKey,
      appId: session.appId,
      expiresAt: session.expiresAt.toISOString(),
    };
  }
}
