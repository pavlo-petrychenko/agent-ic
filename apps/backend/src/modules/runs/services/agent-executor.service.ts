import { NodeType, PortName, nodeOutputFields, outputToZod } from '@agent-ic/flow';
import type { AgentNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import {
  AGENT_INCLUDES_CURRENT_MESSAGE,
  AGENT_MAX_TOOL_ROUNDS,
  AGENT_PURPOSE,
  AGENT_TOOLS,
  LlmStepTraceName,
} from '@/modules/runs/constants/llm-step.constants';
import {
  stepConversation,
  stepModel,
  stepSystemPrompt,
  stepTags,
} from '@/modules/runs/helpers/llm-step.helpers';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type { LlmAgentRequest, LlmAgentResult } from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AgentExecutor implements StepExecutor<AgentNode> {
  readonly nodeType = NodeType.Agent;

  constructor(private readonly llm: LlmGateway) {}

  async execute({ run, node, scope }: StepExecution<AgentNode>): Promise<StepOutcome> {
    const { id, config } = node;
    const request: LlmAgentRequest<StepData> = {
      ...stepModel(id, config.model, AGENT_PURPOSE, run.workspaceId),
      purpose: AGENT_PURPOSE,
      ...stepConversation(
        stepSystemPrompt(id, config.prompt, scope.variables),
        scope.history,
        AGENT_INCLUDES_CURRENT_MESSAGE,
      ),
      output: outputToZod(nodeOutputFields(node)),
      ...(config.reasoning === null ? {} : { reasoning: config.reasoning }),
      tools: AGENT_TOOLS,
      maxToolRounds: AGENT_MAX_TOOL_ROUNDS,
      tags: stepTags(run, LlmStepTraceName.Agent),
    };
    const { output } = await this.answer(request, config.retries);
    return { port: PortName.Next, output };
  }

  private async answer(
    request: LlmAgentRequest<StepData>,
    retriesLeft: number,
  ): Promise<LlmAgentResult<StepData>> {
    try {
      return await this.llm.runAgent(request);
    } catch (error) {
      if (retriesLeft <= 0 || jobFailureActionFor(error) === JobFailureAction.Retry) {
        throw error;
      }
      return this.answer(request, retriesLeft - 1);
    }
  }
}
