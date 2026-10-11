import { Args, Query, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import {
  toGraphqlAgent,
  toGraphqlAgentConnection,
  toGraphqlAgentDraft,
  toGraphqlAgentVersion,
} from '@/modules/agents/helpers/agent-graphql.helpers';
import { GetAgentDraftUseCase } from '@/modules/agents/use-cases/get-agent-draft.use-case';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { ListAgentVersionsUseCase } from '@/modules/agents/use-cases/list-agent-versions.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  AgentConnection,
  AgentDraft,
  AgentVersion,
  QueryAgentArgs,
  QueryAgentDraftArgs,
  QueryAgentVersionsArgs,
  QueryAgentsArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AgentsResolver {
  constructor(
    private readonly listAgentsUseCase: ListAgentsUseCase,
    private readonly getAgentUseCase: GetAgentUseCase,
    private readonly listAgentVersionsUseCase: ListAgentVersionsUseCase,
    private readonly getAgentDraftUseCase: GetAgentDraftUseCase,
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

  @Query()
  async agentVersions(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.AgentId) agentId: QueryAgentVersionsArgs['agentId'],
  ): Promise<AgentVersion[]> {
    const versions = await this.listAgentVersionsUseCase.execute(ctx, { agentId });
    return versions.map(toGraphqlAgentVersion);
  }

  @Query()
  async agentDraft(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.AgentId) agentId: QueryAgentDraftArgs['agentId'],
  ): Promise<AgentDraft> {
    return toGraphqlAgentDraft(await this.getAgentDraftUseCase.execute(ctx, { agentId }));
  }
}
