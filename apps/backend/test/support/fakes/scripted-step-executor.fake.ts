import { PortName } from '@agent-ic/flow';
import type { FlowNode, NodeType } from '@agent-ic/flow';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { StepScript } from '@test/support/constants/runs-testing.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import { SampleNotFoundError } from '@test/support/fixtures/sample-errors.fixture';

export class ScriptedStepExecutor implements StepExecutor {
  readonly executions: StepExecution<FlowNode>[] = [];
  private readonly scripts = new Map<string, StepScript[]>();

  constructor(readonly nodeType: NodeType) {}

  script(nodeId: string, ...scripts: StepScript[]): void {
    this.scripts.set(nodeId, scripts);
  }

  callsFor(runId: string, nodeId: string): number {
    return this.executions.filter(
      (execution) => execution.run.id === runId && execution.node.id === nodeId,
    ).length;
  }

  execute(execution: StepExecution<FlowNode>): Promise<StepOutcome> {
    this.executions.push(execution);
    const { node } = execution;
    switch (this.scripts.get(node.id)?.shift() ?? StepScript.Succeed) {
      case StepScript.Succeed:
        return Promise.resolve({ port: PortName.Next, output: { answer: node.key } });
      case StepScript.Fail:
        return Promise.reject(new SampleNotFoundError());
      case StepScript.Crash:
        return Promise.reject(new WorkerKilledError(node.id));
    }
  }
}
