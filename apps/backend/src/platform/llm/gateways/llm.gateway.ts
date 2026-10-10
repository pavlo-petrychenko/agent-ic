import type {
  LlmCompleteRequest,
  LlmCompletion,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

export abstract class LlmGateway {
  abstract complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>>;
}
