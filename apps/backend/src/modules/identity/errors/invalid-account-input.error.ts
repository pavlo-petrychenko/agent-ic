import { ErrorReason } from '@agent-ic/contracts';
import { INVALID_ACCOUNT_INPUT_MESSAGE } from '@/modules/identity/constants/account-input.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import type { FieldIssue } from '@/platform/errors/typedefs/domain-error.typedefs';

export class InvalidAccountInputError extends DomainError {
  readonly kind = DomainErrorKind.ValidationFailed;
  readonly reason = ErrorReason.InvalidRequest;

  constructor(fields: readonly FieldIssue[]) {
    super(INVALID_ACCOUNT_INPUT_MESSAGE, { fields });
  }
}
