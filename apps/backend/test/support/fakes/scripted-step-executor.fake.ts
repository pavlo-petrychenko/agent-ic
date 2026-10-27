import { PortName } from '@agent-ic/flow';
import type { FlowNode, NodeType } from '@agent-ic/flow';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { StepScript } from '@test/support/constants/runs-testing.constants';
import { SAMPLE_UPSTREAM } from '@test/support/constants/sample-errors.constants';
import { WorkerKilledError } from '@test/support/errors/worker-killed.error';
import {
  SampleNotFoundError,
  SampleUnavailableError,
} from '@test/support/fixtures/sample-errors.fixture';
import type { StepWaiter } from '@test/support/typedefs/runs-testing.typedefs';

export class ScriptedStepExecutor implements StepExecutor {
  readonly executions: StepExecution<FlowNode>[] = [];
  private readonly scripts = new Map<string, StepScript[]>();
  private readonly held = new Map<string, () => void>();
  private waiters: StepWaiter[] = [];

  constructor(readonly nodeType: NodeType) {}

  script(nodeId: string, ...scripts: StepScript[]): void {
    this.scripts.set(nodeId, scripts);
  }

  release(nodeId: string): void {
    this.held.get(nodeId)?.();
  }

  callsFor(runId: string, nodeId: string): number {
    return this.executions.filter(
      (execution) => execution.run.id === runId && execution.node.id === nodeId,
    ).length;
  }

  reached(runId: string, nodeId: string): Promise<void> {
    if (this.callsFor(runId, nodeId) > 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiters.push({ runId, nodeId, resolve }));
  }

  execute(execution: StepExecution<FlowNode>): Promise<StepOutcome> {
    this.executions.push(execution);
    this.wake(execution);
    const { node } = execution;
    const succeeded = { port: PortName.Next, output: { answer: node.key } };
    switch (this.scripts.get(node.id)?.shift() ?? StepScript.Succeed) {
      case StepScript.Succeed:
        return Promise.resolve(succeeded);
      case StepScript.Hold:
        return new Promise((resolve) => this.held.set(node.id, () => resolve(succeeded)));
      case StepScript.Fail:
        return Promise.reject(new SampleNotFoundError());
      case StepScript.RejectUpstream:
        return Promise.reject(new UpstreamError(SAMPLE_UPSTREAM, { retryable: false }));
      case StepScript.Unavailable:
        return Promise.reject(new SampleUnavailableError());
      case StepScript.Crash:
        return Promise.reject(new WorkerKilledError(node.id));
    }
  }

  private wake({ run, node }: StepExecution<FlowNode>): void {
    const woken = this.waiters.filter(
      (waiter) => waiter.runId === run.id && waiter.nodeId === node.id,
    );
    this.waiters = this.waiters.filter((waiter) => !woken.includes(waiter));
    woken.forEach((waiter) => waiter.resolve());
  }
}
