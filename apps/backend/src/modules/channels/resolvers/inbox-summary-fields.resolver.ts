import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InboxSummaryGraphqlParent } from '@/modules/channels/constants/inbox-summary-graphql.constants';
import { GetChannelNamesUseCase } from '@/modules/channels/use-cases/get-channel-names.use-case';
import type { InboxSummaryParent } from '@/modules/conversations';
import { Loader } from '@/platform/graphql-server/decorators/loader.decorator';
import type { LoaderOf } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Resolver(InboxSummaryGraphqlParent.Summary)
export class InboxSummaryFieldsResolver {
  @ResolveField()
  async channelName(
    @Parent() summary: InboxSummaryParent,
    @Loader(GetChannelNamesUseCase) names: LoaderOf<GetChannelNamesUseCase>,
  ): Promise<string | null> {
    return summary.channelRef === null ? null : names.load(summary.channelRef);
  }
}
