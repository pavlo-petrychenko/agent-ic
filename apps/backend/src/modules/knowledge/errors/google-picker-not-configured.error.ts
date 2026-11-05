import { ErrorReason } from '@agent-ic/contracts';
import { GOOGLE_PICKER_NOT_CONFIGURED_MESSAGE } from '@/modules/knowledge/constants/knowledge-error.constants';
import { DomainErrorKind } from '@/platform/errors/constants/domain-error.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export class GooglePickerNotConfiguredError extends DomainError {
  readonly kind = DomainErrorKind.PreconditionFailed;
  readonly reason = ErrorReason.GooglePickerNotConfigured;

  constructor() {
    super(GOOGLE_PICKER_NOT_CONFIGURED_MESSAGE);
  }
}
