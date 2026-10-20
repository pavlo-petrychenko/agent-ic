import { GraphQLError } from 'graphql';
import {
  QUERY_LIMIT_ERROR_CODE,
  QUERY_LIMIT_HTTP_STATUS,
  QUERY_LIMIT_MESSAGE,
} from '@/platform/graphql-server/constants/query-limits.constants';
import type { QueryLimit } from '@/platform/graphql-server/constants/query-limits.constants';

export class QueryLimitError extends GraphQLError {
  constructor(limit: QueryLimit, max: number, actual: number) {
    super(QUERY_LIMIT_MESSAGE[limit], {
      extensions: {
        code: QUERY_LIMIT_ERROR_CODE,
        details: { limit, max, actual },
        http: { status: QUERY_LIMIT_HTTP_STATUS },
      },
    });
  }
}
