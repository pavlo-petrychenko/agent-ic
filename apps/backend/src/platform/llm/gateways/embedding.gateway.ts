import type {
  EmbeddingResult,
  EmbedOptions,
} from '@/platform/llm/typedefs/embedding-gateway.typedefs';

export abstract class EmbeddingGateway {
  abstract embed(texts: readonly string[], options: EmbedOptions): Promise<EmbeddingResult>;
}
