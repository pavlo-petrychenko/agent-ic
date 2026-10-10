import { Args, Query, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import {
  toGraphqlAgent,
  toGraphqlAgentConnection,
} from '@/modules/agents/helpers/agent-graphql.helpers';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  AgentConnection,
  QueryAgentArgs,
  QueryAgentsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AgentsResolver {
  constructor(
    private readonly listAgentsUseCase: ListAgentsUseCase,
    private readonly getAgentUseCase: GetAgentUseCase,
  ) {}

  @Query()
  async agents(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.First) first: QueryAgentsArgs['first'],
    @Args(AgentGraphqlArgument.After) after: QueryAgentsArgs['after'],
  ): Promise<AgentConnection> {
    return toGraphqlAgentConnection(await this.listAgentsUseCase.execute(ctx, { first, after }));
  }

  @Query()
  async agent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Id) id: QueryAgentArgs['id'],
  ): Promise<Agent> {
    return toGraphqlAgent(await this.getAgentUseCase.execute(ctx, { id }));
  }
}
