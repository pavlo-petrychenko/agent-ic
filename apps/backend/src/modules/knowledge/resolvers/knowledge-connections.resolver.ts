import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  toGraphqlGoogleConnection,
  toGraphqlGoogleConnections,
} from '@/modules/knowledge/helpers/knowledge-connection-graphql.helpers';
import { CompleteGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/complete-google-connection.use-case';
import { DisconnectGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/disconnect-google-connection.use-case';
import { ListGoogleConnectionsUseCase } from '@/modules/knowledge/use-cases/list-google-connections.use-case';
import { StartGoogleConnectionUseCase } from '@/modules/knowledge/use-cases/start-google-connection.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CompleteGoogleConnectionInput,
  DisconnectGoogleConnectionInput,
  DisconnectGoogleConnectionPayload,
  GoogleConnection,
  StartGoogleConnectionPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgeConnectionsResolver {
  constructor(
    private readonly listGoogleConnectionsUseCase: ListGoogleConnectionsUseCase,
    private readonly startGoogleConnectionUseCase: StartGoogleConnectionUseCase,
    private readonly completeGoogleConnectionUseCase: CompleteGoogleConnectionUseCase,
    private readonly disconnectGoogleConnectionUseCase: DisconnectGoogleConnectionUseCase,
  ) {}

  @Query()
  async knowledgeConnections(@GraphqlCtx() ctx: UseCaseCtx): Promise<GoogleConnection[]> {
    return toGraphqlGoogleConnections(await this.listGoogleConnectionsUseCase.execute(ctx));
  }

  @Mutation()
  async startGoogleConnection(
    @GraphqlCtx() ctx: UseCaseCtx,
  ): Promise<StartGoogleConnectionPayload> {
    const result = await this.startGoogleConnectionUseCase.execute(ctx);
    return {
      authorizationUrl: result.authorizationUrl,
      expiresAt: result.expiresAt.toISOString(),
    };
  }

  @Mutation()
  async completeGoogleConnection(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: CompleteGoogleConnectionInput,
  ): Promise<GoogleConnection> {
    return toGraphqlGoogleConnection(
      await this.completeGoogleConnectionUseCase.execute(ctx, input),
    );
  }

  @Mutation()
  disconnectGoogleConnection(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: DisconnectGoogleConnectionInput,
  ): Promise<DisconnectGoogleConnectionPayload> {
    return this.disconnectGoogleConnectionUseCase.execute(ctx, input);
  }
}
