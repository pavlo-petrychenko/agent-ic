import { Injectable } from '@nestjs/common';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';
import { ProbeListener } from '@test/support/constants/async-jobs.constants';
import { welcomeOnProbeSignedUp } from '@test/support/jobs/welcome-on-probe-signed-up.job';
import { ProbeCallsRecorderService } from '@test/support/services/probe-calls-recorder.service';
import type { ProbeData } from '@test/support/typedefs/async-jobs.typedefs';

@Injectable()
@OnDomainEvent(welcomeOnProbeSignedUp)
export class WelcomeProbeListener implements JobHandler<ProbeData> {
  constructor(private readonly recorder: ProbeCallsRecorderService) {}

  handle(ctx: UseCaseCtx, data: ProbeData): Promise<void> {
    this.recorder.record({ listener: ProbeListener.Welcome, probeId: data.probeId, ctx });
    return Promise.resolve();
  }
}
