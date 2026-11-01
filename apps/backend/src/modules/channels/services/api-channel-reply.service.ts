import { Injectable } from '@nestjs/common';
import { API_CHANNEL_RESPONSE_TIMEOUT_MS } from '@/modules/channels/constants/api-channel.constants';
import { ApiChannelReplyStatus } from '@/modules/channels/constants/channel.constants';
import { apiChannelReply } from '@/modules/channels/helpers/api-channel-reply.helpers';
import type {
  ApiChannelReply,
  ApiChannelReplyResult,
  ApiChannelReplyStart,
} from '@/modules/channels/typedefs/api-channel-ingress.typedefs';
import {
  RunCompletionService,
  RunReplyCaptureService,
  RunStatus,
  runDoneChannelFor,
} from '@/modules/runs';
import type { RunCompletion, RunDoneEvent } from '@/modules/runs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';
import { LiveUpdatesService } from '@/platform/live-updates/services/live-updates.service';
import type { ChannelStream } from '@/platform/live-updates/typedefs/channel.typedefs';

@Injectable()
export class ApiChannelReplyService {
  constructor(
    private readonly completion: RunCompletionService,
    private readonly capture: RunReplyCaptureService,
    private readonly liveUpdates: LiveUpdatesService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async wait(
    workspaceId: string,
    runId: string,
    start: () => Promise<ApiChannelReplyStart>,
  ): Promise<ApiChannelReplyResult> {
    const events = await this.liveUpdates.subscribe(runDoneChannelFor(runId));
    try {
      await this.capture.start(runId);
      const started = await start();
      if (!started.runStarted) {
        await this.capture.stop(runId);
        return { conversationId: started.conversationId, reply: this.pending() };
      }
      const event = await this.nextOrTimeout(events);
      const completion = await this.completion.read(workspaceId, runId);
      return {
        conversationId: started.conversationId,
        reply: this.reply(completion, event),
      };
    } catch (error) {
      await this.capture.stop(runId);
      throw error;
    } finally {
      await events.return();
    }
  }

  private async nextOrTimeout(events: ChannelStream<RunDoneEvent>): Promise<RunDoneEvent | null> {
    const next = events.next().then((result) => (result.done === true ? null : result.value));
    const timeout = this.clock.sleep(API_CHANNEL_RESPONSE_TIMEOUT_MS).then(() => null);
    const completed = await Promise.race([next, timeout]);
    if (completed === null) {
      next.catch(() => undefined);
    }
    return completed;
  }

  private reply(completion: RunCompletion | null, event: RunDoneEvent | null): ApiChannelReply {
    const status = this.statusOf(completion, event);
    return apiChannelReply(status, completion?.messages ?? [], this.ids);
  }

  private pending(): ApiChannelReply {
    return apiChannelReply(ApiChannelReplyStatus.Pending, [], this.ids);
  }

  private statusOf(
    completion: RunCompletion | null,
    event: RunDoneEvent | null,
  ): ApiChannelReplyStatus {
    const status = completion?.status ?? event?.status ?? null;
    if (status === null) {
      return ApiChannelReplyStatus.Pending;
    }
    if (status === RunStatus.Succeeded) {
      return ApiChannelReplyStatus.Answered;
    }
    if (status === RunStatus.Escalated) {
      return ApiChannelReplyStatus.Escalated;
    }
    return ApiChannelReplyStatus.Pending;
  }
}
