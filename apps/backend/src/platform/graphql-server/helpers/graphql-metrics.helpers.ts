import type { ApolloServerPlugin } from '@apollo/server';
import { Kind } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import {
  GraphqlOutcome,
  UNKNOWN_GRAPHQL_LABEL,
} from '@/platform/graphql-server/constants/graphql-metrics.constants';
import type { GraphqlMetricsService } from '@/platform/graphql-server/services/graphql-metrics.service';

export const rootFieldOf = (operation: OperationDefinitionNode | undefined): string => {
  for (const selection of operation?.selectionSet.selections ?? []) {
    if (selection.kind === Kind.FIELD) {
      return selection.name.value;
    }
  }
  return UNKNOWN_GRAPHQL_LABEL;
};

export const graphqlMetricsPlugin = (metrics: GraphqlMetricsService): ApolloServerPlugin => ({
  requestDidStart: () => {
    const startedAt = metrics.now();
    return Promise.resolve({
      willSendResponse: ({ operation, errors }) => {
        metrics.record({
          type: operation?.operation ?? UNKNOWN_GRAPHQL_LABEL,
          rootField: rootFieldOf(operation),
          outcome: errors === undefined ? GraphqlOutcome.Success : GraphqlOutcome.Error,
          startedAt,
        });
        return Promise.resolve();
      },
    });
  },
});
