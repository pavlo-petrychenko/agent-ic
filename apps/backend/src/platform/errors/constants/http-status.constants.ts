import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import { DomainErrorKind, LimitScope } from '@/platform/errors/constants/domain-error.constants';

export const SERVER_ERROR_STATUS_MIN = 500;

export const HTTP_STATUS_BY_KIND: Readonly<Record<DomainErrorKind, HttpStatus>> = {
  [DomainErrorKind.NotFound]: HttpStatus.NOT_FOUND,
  [DomainErrorKind.Forbidden]: HttpStatus.FORBIDDEN,
  [DomainErrorKind.Unauthenticated]: HttpStatus.UNAUTHORIZED,
  [DomainErrorKind.Conflict]: HttpStatus.CONFLICT,
  [DomainErrorKind.ValidationFailed]: HttpStatus.UNPROCESSABLE_ENTITY,
  [DomainErrorKind.LimitReached]: HttpStatus.PAYMENT_REQUIRED,
  [DomainErrorKind.PreconditionFailed]: HttpStatus.PRECONDITION_FAILED,
  [DomainErrorKind.UnsupportedMediaType]: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
};

export const HTTP_STATUS_BY_LIMIT_SCOPE: Readonly<Record<LimitScope, HttpStatus>> = {
  [LimitScope.Rate]: HttpStatus.TOO_MANY_REQUESTS,
  [LimitScope.Plan]: HttpStatus.PAYMENT_REQUIRED,
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
