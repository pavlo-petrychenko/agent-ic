import { ApolloLink } from '@apollo/client/link';
import { HttpLink } from '@apollo/client/link/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';
import { createClient } from 'graphql-ws';
import { CONNECTION_AUTH_PARAM } from '@/shared/api/constants/request.constants';
import { UrlScheme } from '@/shared/api/constants/url.constants';
import { getRequestContext } from '@/shared/api/helpers/requestContext.helpers';
import type { RuntimeConfig } from '@/shared/config/typedefs/runtimeConfig.typedefs';

export const isSubscriptionOperation = (
  query: Parameters<typeof getMainDefinition>[0],
): boolean => {
  const definition = getMainDefinition(query);
  return (
    definition.kind === Kind.OPERATION_DEFINITION &&
    definition.operation === OperationTypeNode.SUBSCRIPTION
  );
};

export const buildWebSocketUrl = (
  path: string,
  location: Pick<Location, 'protocol' | 'host'>,
): string => {
  const scheme = location.protocol === UrlScheme.Https ? UrlScheme.Wss : UrlScheme.Ws;
  return `${scheme}//${location.host}${path}`;
};

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
