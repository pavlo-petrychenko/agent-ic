import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import { ResumeAgentUseCase } from '@/modules/agents/use-cases/resume-agent.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Agent, ResumeAgentInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ResumeAgentResolver {
  constructor(private readonly resumeAgentUseCase: ResumeAgentUseCase) {}

  @Mutation()
  async resumeAgent(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: ResumeAgentInput,
  ): Promise<Agent> {
    return toGraphqlAgent(await this.resumeAgentUseCase.execute(ctx, input));
  }
}
