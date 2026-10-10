import { STATUS_CODES } from 'node:http';
import { PROBLEM_TYPE_DEFAULT } from '@/platform/errors/constants/problem-details.constants';
import { describeError } from '@/platform/errors/helpers/error-description.helpers';
import type { ProblemDetails } from '@/platform/errors/typedefs/problem-details.typedefs';

export const toProblemDetails = (
  error: unknown,
  traceId: string,
  instance: string,
): ProblemDetails => {
  const description = describeError(error);
  return {
    type: PROBLEM_TYPE_DEFAULT,
    title: STATUS_CODES[description.status] ?? description.reason,
    status: description.status,
    detail: description.message,
    instance,
    code: description.code,
    reason: description.reason,
    traceId,
    ...(description.fields.length > 0 && { errors: description.fields }),
    ...(Object.keys(description.details).length > 0 && { details: description.details }),
  };
};
