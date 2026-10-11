import { Injectable } from '@nestjs/common';
import { ConversationRunsService } from '@/modules/conversations';
import { outboundMessages } from '@/modules/runs/helpers/outbound-message.helpers';
import type { Run } from '@/modules/runs/typedefs/run.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class RunMessagesService {
  constructor(private readonly conversations: ConversationRunsService) {}

  async send(
    ctx: UseCaseCtx,
    run: Run,
    nodeId: string,
    texts: readonly string[],
    quickReplies: readonly string[] = [],
  ): Promise<string[]> {
    const messageIds: string[] = [];
    for (const message of outboundMessages(run, nodeId, texts, quickReplies)) {
      messageIds.push((await this.conversations.recordOutbound(ctx, message)).id);
    }
    return messageIds;
  }
}
