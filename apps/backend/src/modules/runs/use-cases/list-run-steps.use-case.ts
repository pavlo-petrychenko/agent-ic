import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ConversationMode } from '@/modules/conversations';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunViewsService } from '@/modules/runs/services/run-views.service';
import type { RunStepView } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import { groupByKey } from '@/platform/context/helpers/batch.helpers';
import type { BatchUseCase } from '@/platform/context/typedefs/batch-use-case.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListRunStepsUseCase implements BatchUseCase<string, readonly RunStepView[]> {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly steps: RunStepsRepository,
    private readonly views: RunViewsService,
    private readonly ids: IdService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    keys: readonly string[],
  ): Promise<ReadonlyMap<string, readonly RunStepView[]>> {
    const { workspaceId } = authorize(ctx, PermissionResource.Testing, PermissionAction.View);
    const runIds = keys.map((key) => this.ids.fromPublic(IdPrefix.Run, key));
    const steps = await this.tenants.run(workspaceId, () =>
      this.steps.listByRuns(workspaceId, runIds, ConversationMode.Simulation),
    );
    const views = steps.map((step) => ({
      runId: this.ids.toPublic(IdPrefix.Run, step.runId),
      view: this.views.stepView(step),
    }));
    const grouped = groupByKey(keys, views, ({ runId }) => runId);
    return new Map(Array.from(grouped, ([key, group]) => [key, group.map(({ view }) => view)]));
  }
}
