import type { FlowNode } from '@agent-ic/flow';
import { Inject, Injectable } from '@nestjs/common';
import { STEP_EXECUTORS } from '@/modules/runs/constants/run.constants';
import type { StepExecutor } from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class StepExecutorRegistry {
  private readonly byType: ReadonlyMap<string, StepExecutor>;

  constructor(@Inject(STEP_EXECUTORS) executors: readonly StepExecutor[]) {
    this.byType = new Map(executors.map((executor) => [executor.nodeType, executor]));
  }

  find(node: FlowNode): StepExecutor | null {
    return this.byType.get(node.type) ?? null;
  }
}
