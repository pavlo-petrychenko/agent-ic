import { NodeType, pickRoute, resolvePath } from '@agent-ic/flow';
import type { RouterNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class RouterExecutor implements StepExecutor<RouterNode> {
  readonly nodeType = NodeType.Router;

  execute({
    node,
    scope,
  }: Pick<StepExecution<RouterNode>, 'node' | 'scope'>): Promise<StepOutcome> {
    const port = pickRoute(node.config.rules, (path) => resolvePath(scope.variables, path));
    return Promise.resolve({ port, output: {} });
  }
}
