import { ErrorCode } from '@agent-ic/contracts';

export enum DomainErrorKind {
  NotFound = 'not-found',
  Forbidden = 'forbidden',
  Unauthenticated = 'unauthenticated',
  Conflict = 'conflict',
  ValidationFailed = 'validation-failed',
  LimitReached = 'limit-reached',
  PreconditionFailed = 'precondition-failed',
  UnsupportedMediaType = 'unsupported-media-type',
  Unavailable = 'unavailable',
}

export enum LimitScope {
  Rate = 'rate',
  Plan = 'plan',
}

export const ERROR_CODE_BY_KIND: Readonly<Record<DomainErrorKind, ErrorCode>> = {
  [DomainErrorKind.NotFound]: ErrorCode.NotFound,
  [DomainErrorKind.Forbidden]: ErrorCode.Forbidden,
  [DomainErrorKind.Unauthenticated]: ErrorCode.Unauthenticated,
  [DomainErrorKind.Conflict]: ErrorCode.Conflict,
  [DomainErrorKind.ValidationFailed]: ErrorCode.BadUserInput,
  [DomainErrorKind.LimitReached]: ErrorCode.LimitReached,
  [DomainErrorKind.PreconditionFailed]: ErrorCode.PreconditionFailed,
  [DomainErrorKind.UnsupportedMediaType]: ErrorCode.BadUserInput,
  [DomainErrorKind.Unavailable]: ErrorCode.UpstreamError,
};
