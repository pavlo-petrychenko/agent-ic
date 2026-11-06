import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InboxFilterOptionsGraphqlParent } from '@/modules/agents/constants/inbox-filter-options-graphql.constants';
import type { InboxFilterOptionView } from '@/modules/agents/typedefs/inbox-filter-option.typedefs';
import { GetInboxAgentOptionsUseCase } from '@/modules/agents/use-cases/get-inbox-agent-options.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

interface InboxFilterOptionsParent {
  readonly agentRefs: readonly string[];
}

@Resolver(InboxFilterOptionsGraphqlParent.Options)
export class InboxFilterOptionsFieldsResolver {
  @ResolveField()
  async agents(
    @Parent() options: InboxFilterOptionsParent,
    @Loader(GetInboxAgentOptionsUseCase) agents: LoaderOf<GetInboxAgentOptionsUseCase>,
  ): Promise<readonly InboxFilterOptionView[]> {
    const loaded = await Promise.all(options.agentRefs.map((ref) => agents.load(ref)));
    return loaded.filter((option): option is InboxFilterOptionView => option !== null);
  }
}
