import { Injectable } from '@nestjs/common';
import type { HandedBackPayload } from '@/modules/conversations';
import { armInactivityOnHandBackJob } from '@/modules/runs/jobs/arm-inactivity-on-hand-back.job';
import { ArmInactivityOnHandBackUseCase } from '@/modules/runs/use-cases/arm-inactivity-on-hand-back.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { OnDomainEvent } from '@/platform/domain-events/decorators/on-domain-event.decorator';
import type { JobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
@OnDomainEvent(armInactivityOnHandBackJob)
export class ArmInactivityOnHandBackListener implements JobHandler<HandedBackPayload> {
  constructor(private readonly armInactivity: ArmInactivityOnHandBackUseCase) {}

  async handle(ctx: UseCaseCtx, data: HandedBackPayload): Promise<void> {
    await this.armInactivity.execute(ctx, data);
  }
}
