import { ErrorReason } from '@agent-ic/contracts';
import { UNSUPPORTED_NODE_TYPE_MESSAGE } from '@/modules/runs/constants/run-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class UnsupportedNodeTypeError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.UnsupportedNodeType;

  constructor(nodeId: string, nodeType: string) {
    super(UNSUPPORTED_NODE_TYPE_MESSAGE, { details: { nodeId, nodeType } });
  }
}
