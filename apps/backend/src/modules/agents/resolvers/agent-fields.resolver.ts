import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AgentGraphqlParent } from '@/modules/agents/constants/agent-graphql.constants';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import type { AgentParent } from '@/modules/agents/typedefs/agent-graphql.typedefs';
import { CountDraftChangesUseCase } from '@/modules/agents/use-cases/count-draft-changes.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Resolver(AgentGraphqlParent.Agent)
export class AgentFieldsResolver {
  @ResolveField()
  async draftChangeCount(
    @Parent() agent: AgentParent,
    @Loader(CountDraftChangesUseCase) counts: LoaderOf<CountDraftChangesUseCase>,
  ): Promise<number> {
    const count = await counts.load(agent.id);
    if (count === null) {
      throw new AgentNotFoundError();
    }
    return count;
  }
}
