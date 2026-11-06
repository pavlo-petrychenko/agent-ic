import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InboxFilterOptionsGraphqlParent } from '@/modules/channels/constants/inbox-filter-options-graphql.constants';
import type { InboxFilterOptionView } from '@/modules/channels/typedefs/inbox-filter-option.typedefs';
import { GetInboxChannelOptionsUseCase } from '@/modules/channels/use-cases/get-inbox-channel-options.use-case';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

interface InboxFilterOptionsParent {
  readonly channelRefs: readonly string[];
}

@Resolver(InboxFilterOptionsGraphqlParent.Options)
export class InboxFilterOptionsFieldsResolver {
  @ResolveField()
  async channels(
    @Parent() options: InboxFilterOptionsParent,
    @Loader(GetInboxChannelOptionsUseCase) channels: LoaderOf<GetInboxChannelOptionsUseCase>,
  ): Promise<readonly InboxFilterOptionView[]> {
    const loaded = await Promise.all(options.channelRefs.map((ref) => channels.load(ref)));
    return loaded.filter((option): option is InboxFilterOptionView => option !== null);
  }
}
