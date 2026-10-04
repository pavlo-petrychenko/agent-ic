import { getMainDefinition } from '@apollo/client/utilities';
import { Kind, OperationTypeNode } from 'graphql';

import { UrlScheme } from '@/shared/api/api.constants';

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
