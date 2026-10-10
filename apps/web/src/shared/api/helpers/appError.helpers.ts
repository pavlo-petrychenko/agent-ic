import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import {
  ClientErrorCode,
  NETWORK_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from '@/shared/api/constants/clientError.constants';
import { AppError } from '@/shared/api/errors/app.error';
import { type ErrorPayload, errorPayloadSchema } from '@/shared/api/schemas/appError.schema';
import type { ApiFieldError, AppErrorCode } from '@/shared/api/typedefs/appError.typedefs';

const ERROR_CODES: ReadonlySet<string> = new Set(Object.values(ErrorCode));
const ERROR_REASONS: ReadonlySet<string> = new Set(Object.values(ErrorReason));

const isErrorCode = (value: string): value is ErrorCode => ERROR_CODES.has(value);
const isErrorReason = (value: string): value is ErrorReason => ERROR_REASONS.has(value);

const toReason = (value: string | null | undefined): ErrorReason | null =>
  value !== null && value !== undefined && isErrorReason(value) ? value : null;

const toCode = (value: string | null | undefined): AppErrorCode =>
  value !== null && value !== undefined && isErrorCode(value) ? value : ClientErrorCode.Unknown;

const toFields = (payload: ErrorPayload): readonly ApiFieldError[] =>
  (payload.fields ?? payload.errors ?? []).map((field) => ({
    path: field.path,
    reason: toReason(field.reason) ?? ErrorReason.InvalidRequest,
  }));

const fromPayload = (message: string, payload: ErrorPayload, cause: unknown): AppError =>
  new AppError(payload.detail ?? message, {
    code: toCode(payload.code),
    reason: toReason(payload.reason),
    traceId: payload.traceId ?? null,
    fields: toFields(payload),
    details: payload.details ?? {},
    cause,
  });

const parsePayload = (value: unknown): ErrorPayload => {
  const parsed = errorPayloadSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
};

const parseBodyText = (bodyText: string): ErrorPayload => {
  try {
    return parsePayload(JSON.parse(bodyText));
  } catch {
    return {};
  }
};

export const toAppErrorFromProblem = (bodyText: string, fallbackMessage: string): AppError =>
  fromPayload(fallbackMessage, parseBodyText(bodyText), null);

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    return fromPayload(first?.message ?? error.message, parsePayload(first?.extensions), error);
  }
  if (ServerError.is(error)) {
    return fromPayload(error.message, parseBodyText(error.bodyText), error);
  }
  if (error instanceof Error) {
    return new AppError(NETWORK_ERROR_MESSAGE, { code: ClientErrorCode.Network, cause: error });
  }
  return new AppError(UNKNOWN_ERROR_MESSAGE, { code: ClientErrorCode.Unknown, cause: error });
}
