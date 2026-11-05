import { Injectable, Logger } from '@nestjs/common';
import { ConversationRunsService } from '@/modules/conversations';
import { runDoneChannelFor } from '@/modules/runs/channels/run-done.channel';
import { RunLogMessage } from '@/modules/runs/constants/run-log.constants';
import { UNFINISHED_RUN_STATUSES } from '@/modules/runs/constants/run.constants';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type { RunCompletion } from '@/modules/runs/typedefs/run-completion.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';

@Injectable()
export class RunCompletionService {
  private readonly logger = new Logger(RunCompletionService.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly conversations: ConversationRunsService,
    private readonly liveUpdates: LiveUpdatesService,
  ) {}

  async publishFinished(workspaceId: string, runId: string): Promise<void> {
    const run = await this.tenants.run(workspaceId, () => this.runs.findById(workspaceId, runId));
    if (run === null || UNFINISHED_RUN_STATUSES.includes(run.status)) {
      return;
    }
    try {
      await this.liveUpdates.publish(runDoneChannelFor(run.id), {
        runId: run.id,
        conversationId: run.conversationId,
        status: run.status,
      });
    } catch (error) {
      this.logger.warn({ msg: RunLogMessage.CompletionPublishFailed, runId, err: error });
    }
  }

  read(workspaceId: string, runId: string): Promise<RunCompletion | null> {
    return this.tenants.run(workspaceId, async () => {
      const run = await this.runs.findById(workspaceId, runId);
      if (run === null) {
        return null;
      }
      return {
        status: run.status,
        messages: await this.conversations.messagesByRun(workspaceId, runId),
      };
    });
  }
}
