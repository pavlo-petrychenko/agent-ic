import { GraphQLError } from 'graphql';
import { describeError } from '@/platform/errors/helpers/error-description.helpers';
import type { GraphqlErrorExtensions } from '@/platform/errors/typedefs/graphql-error.typedefs';

export const toGraphqlError = (error: unknown, traceId: string): GraphQLError => {
  const description = describeError(error);
  const extensions: GraphqlErrorExtensions = {
    code: description.code,
    reason: description.reason,
    traceId,
    ...(description.fields.length > 0 && { fields: description.fields }),
    http: { status: description.status },
  };
  return new GraphQLError(description.message, { extensions: { ...extensions } });
};
