import { NodeType, nodeOutputFields, outputToZod, withoutEmptyOutputs } from '@agent-ic/flow';
import type { AgentNode } from '@agent-ic/flow';
import { Inject, Injectable } from '@nestjs/common';
import { KnowledgeToolsService } from '@/modules/knowledge';
import {
  AGENT_INCLUDES_CURRENT_MESSAGE,
  AGENT_MAX_TOOL_ROUNDS,
  AGENT_PURPOSE,
} from '@/modules/runs/constants/llm-step.constants';
import { agentExitPort, withAgentExits } from '@/modules/runs/helpers/agent-exit.helpers';
import {
  stepConversation,
  stepModel,
  stepSystemPrompt,
} from '@/modules/runs/helpers/llm-step.helpers';
import { runTraceTags, stepPromptTags } from '@/modules/runs/helpers/run-tracing.helpers';
import { toRunToolCalls } from '@/modules/runs/helpers/tool-call.helpers';
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
import type {
  LlmAgentRequest,
  LlmAgentResult,
  LlmToolCall,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AgentExecutor implements StepExecutor<AgentNode> {
  readonly nodeType = NodeType.Agent;

  constructor(
    private readonly llm: LlmGateway,
    private readonly ids: IdService,
    @Inject(KnowledgeToolsService) private readonly knowledgeTools: KnowledgeToolsService | null,
  ) {}

  async execute({ run, node, scope, onToolCalls }: StepExecution<AgentNode>): Promise<StepOutcome> {
    const { id, config } = node;
    const tools =
      this.knowledgeTools === null
        ? {}
        : await this.knowledgeTools.toolsFor(run.workspaceId, config.knowledgeBaseIds);
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
        run.trigger,
      ),
      output: outputToZod(nodeOutputFields(node)),
      ...(config.reasoning === null ? {} : { reasoning: config.reasoning }),
      tools,
      maxToolRounds: AGENT_MAX_TOOL_ROUNDS,
      tags: { ...runTraceTags(run), ...stepPromptTags(id, scope.prompts) },
    };
    const report = (calls: readonly LlmToolCall[]) => onToolCalls?.(toRunToolCalls(calls));
    const answer = await this.answer(request, config.retries, report);
    report(answer.toolCalls);
    const output = withoutEmptyOutputs(answer.output);
    return { port: agentExitPort(node, output), output };
  }

  private async answer(
    request: LlmAgentRequest<StepData>,
    retriesLeft: number,
    report: (calls: readonly LlmToolCall[]) => void,
  ): Promise<LlmAgentResult<StepData>> {
    let progress = request.resumeFrom;
    try {
      return await this.llm.runAgent({
        ...request,
        onProgress: (next) => {
          progress = next;
          report(next.toolCalls);
        },
      });
    } catch (error) {
      if (retriesLeft <= 0 || jobFailureActionFor(error) === JobFailureAction.Retry) {
        throw error;
      }
      return this.answer({ ...request, resumeFrom: progress }, retriesLeft - 1, report);
    }
  }
}
