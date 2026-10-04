import { ApolloLink } from '@apollo/client/link';
import { HttpLink } from '@apollo/client/link/http';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';
import { type Client, createClient } from 'graphql-ws';
import { BEARER_SCHEME, ConnectionParam } from '@/shared/api/constants/request.constants';
import { UrlScheme } from '@/shared/api/constants/url.constants';
import {
  getRequestContext,
  subscribeToWorkspaceId,
} from '@/shared/api/helpers/requestContext.helpers';
import type { RequestContextState } from '@/shared/api/typedefs/requestContext.typedefs';
import type { SessionClient, WsConnection } from '@/shared/api/typedefs/session.typedefs';
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

export const buildConnectionParams = ({
  accessToken,
  workspaceId,
}: Readonly<RequestContextState>): Record<string, string> => ({
  ...(accessToken === null
    ? {}
    : { [ConnectionParam.Authorization]: `${BEARER_SCHEME} ${accessToken}` }),
  ...(workspaceId === null ? {} : { [ConnectionParam.WorkspaceId]: workspaceId }),
});

export const createWsClient = (url: string, session: SessionClient): Client => {
  let connection: WsConnection | null = null;
  const client = createClient({
    url,
    lazy: true,
    connectionParams: async () => {
      await session.ensureFresh();
      const context = getRequestContext();
      connection = { accessToken: context.accessToken, workspaceId: context.workspaceId };
      return buildConnectionParams(context);
    },
  });
  const terminateWhenStale = (): void => {
    if (
      connection !== null &&
      (session.getAccessToken() !== connection.accessToken ||
        getRequestContext().workspaceId !== connection.workspaceId)
    ) {
      client.terminate();
    }
  };
  session.subscribe(terminateWhenStale);
  subscribeToWorkspaceId(terminateWhenStale);
  return client;
};

export const createSplitLink = (config: RuntimeConfig, session: SessionClient): ApolloLink =>
  ApolloLink.split(
    ({ query }) => isSubscriptionOperation(query),
    new GraphQLWsLink(
      createWsClient(buildWebSocketUrl(config.graphqlPath, window.location), session),
    ),
    new HttpLink({ uri: config.graphqlPath }),
  );
