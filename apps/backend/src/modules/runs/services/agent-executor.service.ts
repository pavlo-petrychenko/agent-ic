import { NodeType, nodeOutputFields, outputToZod } from '@agent-ic/flow';
import type { AgentNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import {
  AGENT_INCLUDES_CURRENT_MESSAGE,
  AGENT_MAX_TOOL_ROUNDS,
  AGENT_PURPOSE,
  AGENT_TOOLS,
} from '@/modules/runs/constants/llm-step.constants';
import { agentExitPort, withAgentExits } from '@/modules/runs/helpers/agent-exit.helpers';
import {
  stepConversation,
  stepModel,
  stepSystemPrompt,
} from '@/modules/runs/helpers/llm-step.helpers';
import { runTraceTags, stepPromptTags } from '@/modules/runs/helpers/run-tracing.helpers';
import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type { LlmAgentRequest, LlmAgentResult } from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AgentExecutor implements StepExecutor<AgentNode> {
  readonly nodeType = NodeType.Agent;

  constructor(
    private readonly llm: LlmGateway,
    private readonly ids: IdService,
  ) {}

  async execute({ run, node, scope }: StepExecution<AgentNode>): Promise<StepOutcome> {
    const { id, config } = node;
    const request: LlmAgentRequest<StepData> = {
      ...stepModel(id, config.model, AGENT_PURPOSE, run.workspaceId, this.ids),
      purpose: AGENT_PURPOSE,
      ...stepConversation(
        withAgentExits(
          stepSystemPrompt(id, config.prompt, scope.variables, scope.prompts),
          node,
          scope.variables,
        ),
        scope.history,
        AGENT_INCLUDES_CURRENT_MESSAGE,
      ),
      output: outputToZod(nodeOutputFields(node)),
      ...(config.reasoning === null ? {} : { reasoning: config.reasoning }),
      tools: AGENT_TOOLS,
      maxToolRounds: AGENT_MAX_TOOL_ROUNDS,
      tags: { ...runTraceTags(run), ...stepPromptTags(id, scope.prompts) },
    };
    const { output } = await this.answer(request, config.retries);
    return { port: agentExitPort(node, output), output };
  }

  private async answer(
    request: LlmAgentRequest<StepData>,
    retriesLeft: number,
  ): Promise<LlmAgentResult<StepData>> {
    let progress = request.resumeFrom;
    try {
      return await this.llm.runAgent({
        ...request,
        onProgress: (next) => {
          progress = next;
        },
      });
    } catch (error) {
      if (retriesLeft <= 0 || jobFailureActionFor(error) === JobFailureAction.Retry) {
        throw error;
      }
      return this.answer({ ...request, resumeFrom: progress }, retriesLeft - 1);
    }
  }
}
