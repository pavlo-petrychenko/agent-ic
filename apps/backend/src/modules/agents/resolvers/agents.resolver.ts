import { Args, Query, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import {
  toGraphqlAgent,
  toGraphqlAgentConnection,
  toGraphqlAgentDraft,
  toGraphqlAgentVersion,
  toGraphqlFlowDiff,
  toGraphqlPublishPreview,
} from '@/modules/agents/helpers/agent-graphql.helpers';
import { CompareAgentVersionsUseCase } from '@/modules/agents/use-cases/compare-agent-versions.use-case';
import { GetAgentDraftUseCase } from '@/modules/agents/use-cases/get-agent-draft.use-case';
import { GetAgentUseCase } from '@/modules/agents/use-cases/get-agent.use-case';
import { ListAgentVersionsUseCase } from '@/modules/agents/use-cases/list-agent-versions.use-case';
import { ListAgentsUseCase } from '@/modules/agents/use-cases/list-agents.use-case';
import { PreviewAgentPublishUseCase } from '@/modules/agents/use-cases/preview-agent-publish.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Agent,
  AgentConnection,
  AgentDraft,
  AgentVersion,
  FlowDiff,
  PublishPreview,
  QueryAgentArgs,
  QueryAgentDraftArgs,
  QueryAgentVersionDiffArgs,
  QueryAgentVersionsArgs,
  QueryAgentsArgs,
  QueryPublishPreviewArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AgentsResolver {
  constructor(
    private readonly listAgentsUseCase: ListAgentsUseCase,
    private readonly getAgentUseCase: GetAgentUseCase,
    private readonly listAgentVersionsUseCase: ListAgentVersionsUseCase,
    private readonly getAgentDraftUseCase: GetAgentDraftUseCase,
    private readonly compareAgentVersionsUseCase: CompareAgentVersionsUseCase,
    private readonly previewAgentPublishUseCase: PreviewAgentPublishUseCase,
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

  @Query()
  async agentVersionDiff(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.AgentId) agentId: QueryAgentVersionDiffArgs['agentId'],
    @Args(AgentGraphqlArgument.FromId) fromId: QueryAgentVersionDiffArgs['fromId'],
    @Args(AgentGraphqlArgument.ToId) toId: QueryAgentVersionDiffArgs['toId'],
  ): Promise<FlowDiff> {
    return toGraphqlFlowDiff(
      await this.compareAgentVersionsUseCase.execute(ctx, { agentId, fromId, toId }),
    );
  }

  @Query()
  async publishPreview(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.AgentId) agentId: QueryPublishPreviewArgs['agentId'],
  ): Promise<PublishPreview> {
    return toGraphqlPublishPreview(await this.previewAgentPublishUseCase.execute(ctx, { agentId }));
  }
}
