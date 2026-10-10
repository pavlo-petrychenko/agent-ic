import type { LlmReply, LlmReplyRequest } from '@/platform/llm/typedefs/llm-gateway.typedefs';

export abstract class LlmGateway {
  abstract generateReply<T>(request: LlmReplyRequest<T>): Promise<LlmReply<T>>;
}
