import { NodeType, PortName } from '@agent-ic/flow';
import type { ParallelNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type { StepExecutor, StepOutcome } from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class ParallelExecutor implements StepExecutor<ParallelNode> {
  readonly nodeType = NodeType.Parallel;

  execute(): Promise<StepOutcome> {
    return Promise.resolve({ port: PortName.Next, output: {} });
  }
}
