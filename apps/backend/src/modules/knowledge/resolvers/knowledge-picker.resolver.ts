import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlGooglePickerSkippedDocuments } from '@/modules/knowledge/helpers/knowledge-picker-graphql.helpers';
import { toGraphqlKnowledgeSource } from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { CreateGoogleDocsSourceUseCase } from '@/modules/knowledge/use-cases/create-google-docs-source.use-case';
import { CreateGooglePickerSessionUseCase } from '@/modules/knowledge/use-cases/create-google-picker-session.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CreateGoogleDocsSourceInput,
  CreateGoogleDocsSourcePayload,
  GooglePickerSession,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgePickerResolver {
  constructor(
    private readonly createSessionUseCase: CreateGooglePickerSessionUseCase,
    private readonly createSourceUseCase: CreateGoogleDocsSourceUseCase,
  ) {}

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

  @Mutation()
  async createGoogleDocsSource(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: CreateGoogleDocsSourceInput,
  ): Promise<CreateGoogleDocsSourcePayload> {
    const result = await this.createSourceUseCase.execute(ctx, input);
    return {
      source: toGraphqlKnowledgeSource(result.source),
      skipped: toGraphqlGooglePickerSkippedDocuments(result.skipped),
    };
  }
}
