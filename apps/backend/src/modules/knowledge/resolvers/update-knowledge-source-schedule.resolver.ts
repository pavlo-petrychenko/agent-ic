import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphqlArgument } from '@/modules/knowledge/constants/knowledge-input.constants';
import {
  toGraphqlKnowledgeSource,
  toUpdateKnowledgeSourceScheduleInput,
} from '@/modules/knowledge/helpers/knowledge-source-graphql.helpers';
import { UpdateKnowledgeSourceScheduleUseCase } from '@/modules/knowledge/use-cases/update-knowledge-source-schedule.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  KnowledgeSource,
  UpdateSourceScheduleInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateKnowledgeSourceScheduleResolver {
  constructor(
    private readonly updateKnowledgeSourceScheduleUseCase: UpdateKnowledgeSourceScheduleUseCase,
  ) {}

  @Mutation()
  async updateSourceSchedule(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(KnowledgeGraphqlArgument.Input) input: UpdateSourceScheduleInput,
  ): Promise<KnowledgeSource> {
    return toGraphqlKnowledgeSource(
      await this.updateKnowledgeSourceScheduleUseCase.execute(
        ctx,
        toUpdateKnowledgeSourceScheduleInput(input),
      ),
    );
  }
}
