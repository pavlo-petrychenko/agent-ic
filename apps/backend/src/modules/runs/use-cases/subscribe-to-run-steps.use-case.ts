import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ConversationMode } from '@/modules/conversations';
import { runStepsChannel } from '@/modules/runs/channels/run-steps.channel';
import { RunNotFoundError } from '@/modules/runs/errors/run-not-found.error';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type {
  RunStepUpdate,
  RunStepsInput,
} from '@/modules/runs/typedefs/run-step-update.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { mapChannelStream } from '@/platform/live-updates/helpers/channel-stream.helpers';
import { channelFor } from '@/platform/live-updates/helpers/channel.helpers';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Injectable()
export class SubscribeToRunStepsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly runs: RunsRepository,
    private readonly liveUpdates: LiveUpdatesService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: RunStepsInput): Promise<ChannelStream<RunStepUpdate>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const runId = this.ids.fromPublic(IdPrefix.Run, input.runId);
    await this.tenants.run(workspaceId, async () => {
      const run = await this.runs.findById(workspaceId, runId);
      if (run?.mode !== ConversationMode.Simulation) {
        throw new RunNotFoundError(input.runId);
      }
    });
    const events = await this.liveUpdates.subscribe(channelFor(runStepsChannel, runId));
    return mapChannelStream(events, (event) => ({
      runId: input.runId,
      stepId: this.ids.toPublic(IdPrefix.RunStep, event.stepId),
      nodeId: event.nodeId,
      status: event.status,
    }));
  }
}
