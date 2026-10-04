import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODE_BY_KIND } from '@/platform/errors/constants/domain-error.constants';
import { INTERNAL_ERROR_MESSAGE } from '@/platform/errors/constants/error-description.constants';
import {
  ERROR_CODE_BY_HTTP_STATUS,
  HTTP_STATUS_BY_KIND,
  HTTP_STATUS_BY_LIMIT_SCOPE,
  REASON_BY_HTTP_STATUS,
  SERVER_ERROR_STATUS_MIN,
} from '@/platform/errors/constants/http-status.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LimitReachedError } from '@/platform/errors/errors/limit-reached.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import type { ErrorDescription } from '@/platform/errors/typedefs/error-description.typedefs';

const isServerErrorStatus = (status: number): boolean => status >= SERVER_ERROR_STATUS_MIN;

const INTERNAL_ERROR: ErrorDescription = {
  code: ErrorCode.Internal,
  reason: ErrorReason.Internal,
  message: INTERNAL_ERROR_MESSAGE,
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  fields: [],
};

const describeDomainError = (error: DomainError): ErrorDescription => ({
  code: ERROR_CODE_BY_KIND[error.kind],
  reason: error.reason,
  message: error.message,
  status:
    error instanceof LimitReachedError
      ? HTTP_STATUS_BY_LIMIT_SCOPE[error.scope]
      : HTTP_STATUS_BY_KIND[error.kind],
  fields: error.fields,
});

const describeUpstreamError = (error: UpstreamError): ErrorDescription => ({
  code: ErrorCode.UpstreamError,
  reason: error.reason,
  message: error.message,
  status: HttpStatus.BAD_GATEWAY,
  fields: [],
});

const describeHttpException = (exception: HttpException): ErrorDescription => {
  const status = exception.getStatus();
  if (isServerErrorStatus(status)) {
    return { ...INTERNAL_ERROR, status };
  }
  return {
    code: ERROR_CODE_BY_HTTP_STATUS.get(status) ?? ErrorCode.BadUserInput,
    reason: REASON_BY_HTTP_STATUS.get(status) ?? ErrorReason.InvalidRequest,
    message: exception.message,
    status,
    fields: [],
  };
};

export const describeError = (error: unknown): ErrorDescription => {
  if (error instanceof DomainError) {
    return describeDomainError(error);
  }
  if (error instanceof UpstreamError) {
    return describeUpstreamError(error);
  }
  if (error instanceof HttpException) {
    return describeHttpException(error);
  }
  return INTERNAL_ERROR;
};
