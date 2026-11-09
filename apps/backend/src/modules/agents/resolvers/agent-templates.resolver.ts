import { Args, Query, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgentTemplate } from '@/modules/agents/helpers/agent-template-graphql.helpers';
import { ListAgentTemplatesUseCase } from '@/modules/agents/use-cases/list-agent-templates.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  AgentTemplate,
  QueryAgentTemplatesArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AgentTemplatesResolver {
  constructor(private readonly listAgentTemplatesUseCase: ListAgentTemplatesUseCase) {}

  @Query()
  agentTemplates(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Kind) kind: QueryAgentTemplatesArgs['kind'],
  ): AgentTemplate[] {
    return this.listAgentTemplatesUseCase.execute(ctx, { kind }).map(toGraphqlAgentTemplate);
  }
}
