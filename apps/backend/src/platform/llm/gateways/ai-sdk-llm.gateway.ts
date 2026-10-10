import { Injectable } from '@nestjs/common';
import { generateText, stepCountIs } from 'ai';
import type { LanguageModel, ModelMessage } from 'ai';
import {
  LLM_MAX_TOOL_ROUNDS,
  LLM_REPLY_ATTEMPTS,
  LLM_REPLY_TOOL_NAME,
  LLM_SDK_MAX_RETRIES,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmReplyInvalidError } from '@/platform/llm/errors/llm-reply-invalid.error';
import { LlmReplyMissingError } from '@/platform/llm/errors/llm-reply-missing.error';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import {
  invalidReplyMessage,
  toModelMessages,
  toToolSet,
} from '@/platform/llm/helpers/llm-gateway.helpers';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmReply, LlmReplyRequest } from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AiSdkLlmGateway extends LlmGateway {
  constructor(private readonly providers: ProviderResolverService) {
    super();
  }

  async generateReply<T>(request: LlmReplyRequest<T>): Promise<LlmReply<T>> {
    const model = this.providers.languageModel(request.provider, request.model);
    return this.attempt(request, model, toModelMessages(request.messages), LLM_REPLY_ATTEMPTS);
  }

  private async attempt<T>(
    request: LlmReplyRequest<T>,
    model: LanguageModel,
    messages: readonly ModelMessage[],
    attemptsLeft: number,
  ): Promise<LlmReply<T>> {
    const result = await generateText({
      model,
      instructions: request.system,
      messages: [...messages],
      tools: toToolSet(request.tools, request.schema),
      stopWhen: stepCountIs(LLM_MAX_TOOL_ROUNDS),
      maxRetries: LLM_SDK_MAX_RETRIES,
    });
    const replyCall = result.toolCalls.find(({ toolName }) => toolName === LLM_REPLY_TOOL_NAME);
    if (replyCall === undefined) {
      throw new LlmReplyMissingError(request.model);
    }
    const parsed = request.schema.safeParse(replyCall.input);
    if (parsed.success) {
      return { value: parsed.data };
    }
    if (attemptsLeft <= 1) {
      throw new LlmReplyInvalidError(request.model, parsed.error);
    }
    return this.attempt(
      request,
      model,
      [
        ...messages,
        ...result.response.messages,
        invalidReplyMessage(replyCall.toolCallId, parsed.error),
      ],
      attemptsLeft - 1,
    );
  }
}
