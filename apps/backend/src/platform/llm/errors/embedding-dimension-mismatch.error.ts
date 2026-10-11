import { ErrorReason } from '@agent-ic/contracts';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { EMBEDDING_DIMENSION_MISMATCH_MESSAGE } from '@/platform/llm/constants/embedding-gateway.constants';
import type { EmbeddingModelId } from '@/platform/llm/constants/llm-model.constants';

export class EmbeddingDimensionMismatchError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.EmbeddingDimensionMismatch;

  constructor(model: EmbeddingModelId, expected: number, received: number) {
    super(EMBEDDING_DIMENSION_MISMATCH_MESSAGE, { details: { model, expected, received } });
  }
}
