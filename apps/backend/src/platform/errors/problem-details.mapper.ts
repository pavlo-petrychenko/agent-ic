import { STATUS_CODES } from 'node:http';
import { Injectable } from '@nestjs/common';
import { PROBLEM_TYPE_DEFAULT } from '@/platform/errors/errors.constants';
import { describeError } from '@/platform/errors/errors.helpers';
import type { ProblemDetails } from '@/platform/errors/errors.typedefs';

@Injectable()
export class ProblemDetailsMapper {
  toProblem(error: unknown, traceId: string, instance: string): ProblemDetails {
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
    };
  }
}
