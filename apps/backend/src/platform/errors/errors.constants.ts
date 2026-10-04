import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorReason } from '@agent-ic/contracts';

export enum DomainErrorKind {
  NotFound = 'not-found',
  Forbidden = 'forbidden',
  Unauthenticated = 'unauthenticated',
  Conflict = 'conflict',
  ValidationFailed = 'validation-failed',
  LimitReached = 'limit-reached',
  PreconditionFailed = 'precondition-failed',
}

export enum LimitScope {
  Rate = 'rate',
  Plan = 'plan',
}

export enum JobFailureAction {
  Retry = 'retry',
  GiveUp = 'give-up',
}

export enum ErrorLogMessage {
  DomainError = 'domain error',
  UpstreamError = 'upstream error',
  RequestRejected = 'request rejected',
  UnexpectedError = 'unexpected error',
}

export const ERROR_CODE_BY_KIND: Readonly<Record<DomainErrorKind, ErrorCode>> = {
  [DomainErrorKind.NotFound]: ErrorCode.NotFound,
  [DomainErrorKind.Forbidden]: ErrorCode.Forbidden,
  [DomainErrorKind.Unauthenticated]: ErrorCode.Unauthenticated,
  [DomainErrorKind.Conflict]: ErrorCode.Conflict,
  [DomainErrorKind.ValidationFailed]: ErrorCode.BadUserInput,
  [DomainErrorKind.LimitReached]: ErrorCode.LimitReached,
  [DomainErrorKind.PreconditionFailed]: ErrorCode.PreconditionFailed,
};

export const HTTP_STATUS_BY_KIND: Readonly<Record<DomainErrorKind, HttpStatus>> = {
  [DomainErrorKind.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.Forbidden]: HttpStatus.FORBIDDEN,
  [DomainErrorKind.Unauthenticated]: HttpStatus.UNAUTHORIZED,
  [DomainErrorKind.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKind.ValidationFailed]: HttpStatus.UNPROCESSABLE_ENTITY,
  [DomainErrorKind.LimitReached]: HttpStatus.PAYMENT_REQUIRED,
  [DomainErrorKind.PreconditionFailed]: HttpStatus.PRECONDITION_FAILED,
};

export const HTTP_STATUS_BY_LIMIT_SCOPE: Readonly<Record<LimitScope, HttpStatus>> = {
  [LimitScope.Rate]: HttpStatus.TOO_MANY_REQUESTS,
  [LimitScope.Plan]: HttpStatus.PAYMENT_REQUIRED,
};

export const JOB_ACTION_BY_LIMIT_SCOPE: Readonly<Record<LimitScope, JobFailureAction>> = {
  [LimitScope.Rate]: JobFailureAction.Retry,
  [LimitScope.Plan]: JobFailureAction.GiveUp,
};

export const ERROR_CODE_BY_HTTP_STATUS: ReadonlyMap<number, ErrorCode> = new Map([
  [HttpStatus.UNAUTHORIZED, ErrorCode.Unauthenticated],
  [HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
  [HttpStatus.NOT_FOUND, ErrorCode.NotFound],
  [HttpStatus.CONFLICT, ErrorCode.Conflict],
  [HttpStatus.PRECONDITION_FAILED, ErrorCode.PreconditionFailed],
  [HttpStatus.TOO_MANY_REQUESTS, ErrorCode.LimitReached],
]);

export const REASON_BY_HTTP_STATUS: ReadonlyMap<number, ErrorReason> = new Map([
  [HttpStatus.NOT_FOUND, ErrorReason.RouteNotFound],
]);

export const RETRYABLE_UPSTREAM_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.REQUEST_TIMEOUT,
  HttpStatus.TOO_MANY_REQUESTS,
]);

export const SERVER_ERROR_STATUS_MIN = 500;
export const PROBLEM_CONTENT_TYPE = 'application/problem+json';
export const PROBLEM_TYPE_DEFAULT = 'about:blank';
export const INTERNAL_ERROR_MESSAGE = 'An unexpected error occurred.';
export const UPSTREAM_ERROR_MESSAGE = 'An upstream service failed.';

export enum TransportType {
  Http = 'http',
  Graphql = 'graphql',
}
