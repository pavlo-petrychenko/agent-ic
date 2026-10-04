import { ApolloLink } from '@apollo/client/link';
import { HttpLink } from '@apollo/client/link/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { CONNECTION_AUTH_PARAM } from '@/shared/api/api.constants';
import { buildWebSocketUrl, isSubscriptionOperation } from '@/shared/api/links/splitLink.helpers';
import { getRequestContext } from '@/shared/api/requestContext';
import type { RuntimeConfig } from '@/shared/config/runtimeConfig.typedefs';

const createWsLink = (config: RuntimeConfig): GraphQLWsLink =>
  new GraphQLWsLink(
    createClient({
      url: buildWebSocketUrl(config.graphqlPath, window.location),
      lazy: true,
      connectionParams: () => {
        const { accessToken } = getRequestContext();
        return accessToken === null ? {} : { [CONNECTION_AUTH_PARAM]: accessToken };
      },
    }),
  );

export const createSplitLink = (config: RuntimeConfig): ApolloLink =>
  ApolloLink.split(
    ({ query }) => isSubscriptionOperation(query),
    createWsLink(config),
    new HttpLink({ uri: config.graphqlPath }),
  );
