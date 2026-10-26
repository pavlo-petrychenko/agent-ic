import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import { toGraphqlKnowledgeSource } from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { ConfirmUploadUseCase } from '@/modules/knowledge/use-cases/confirm-upload.use-case';
import { CreateUploadUseCase } from '@/modules/knowledge/use-cases/create-upload.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ConfirmUploadInput,
  CreateUploadInput,
  CreateUploadPayload,
  KnowledgeSource,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class KnowledgeUploadResolver {
  constructor(
    private readonly createUploadUseCase: CreateUploadUseCase,
    private readonly confirmUploadUseCase: ConfirmUploadUseCase,
  ) {}

  @Mutation()
  createUpload(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: CreateUploadInput,
  ): Promise<CreateUploadPayload> {
    return this.createUploadUseCase.execute(ctx, input);
  }

  @Mutation()
  async confirmUpload(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: ConfirmUploadInput,
  ): Promise<KnowledgeSource> {
    return toGraphqlKnowledgeSource(await this.confirmUploadUseCase.execute(ctx, input));
  }
}
