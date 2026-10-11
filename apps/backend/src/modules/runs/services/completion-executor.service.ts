import { CompletionRole, NodeType, PortName, outputToZod } from '@agent-ic/flow';
import type { CompletionNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { COMPLETION_PURPOSE } from '@/modules/runs/constants/llm-step.constants';
import {
  stepConversation,
  stepModel,
  stepSystemPrompt,
} from '@/modules/runs/helpers/llm-step.helpers';
import { runTraceTags } from '@/modules/runs/helpers/run-tracing.helpers';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';

@Injectable()
export class CompletionExecutor implements StepExecutor<CompletionNode> {
  readonly nodeType = NodeType.Completion;

  constructor(private readonly llm: LlmGateway) {}

  async execute({ run, node, scope }: StepExecution<CompletionNode>): Promise<StepOutcome> {
    const { id, config } = node;
    const { output } = await this.llm.complete({
      ...stepModel(id, config.model, COMPLETION_PURPOSE, run.workspaceId),
      purpose: COMPLETION_PURPOSE,
      ...stepConversation(
        stepSystemPrompt(id, config.prompt, scope.variables),
        scope.history,
        config.input.includeCurrentMessage,
      ),
      output: outputToZod(config.output),
      ...(config.reasoning === null ? {} : { reasoning: config.reasoning }),
      tags: runTraceTags(run),
    });
    return { port: config.role === CompletionRole.Guard ? PortName.Next : null, output };
  }
}
