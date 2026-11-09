import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AgentGraphqlArgument } from '@/modules/agents/constants/agent-input.constants';
import { toGraphqlAgent } from '@/modules/agents/helpers/agent-graphql.helpers';
import type { AgentParent } from '@/modules/agents/typedefs/agent-graphql.typedefs';
import { CreateAgentFromTemplateUseCase } from '@/modules/agents/use-cases/create-agent-from-template.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { CreateAgentFromTemplateInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateAgentFromTemplateResolver {
  constructor(private readonly createAgentFromTemplateUseCase: CreateAgentFromTemplateUseCase) {}

  @Mutation()
  async createAgentFromTemplate(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(AgentGraphqlArgument.Input) input: CreateAgentFromTemplateInput,
  ): Promise<AgentParent> {
    return toGraphqlAgent(await this.createAgentFromTemplateUseCase.execute(ctx, input));
  }
}
