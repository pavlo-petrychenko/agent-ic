import { ApolloClient, ApolloLink, defaultDataIdFromObject, InMemoryCache } from '@apollo/client';
import { createAuthLink } from '@/shared/api/helpers/authLink.helpers';
import { createErrorLink } from '@/shared/api/helpers/errorLink.helpers';
import { createSplitLink } from '@/shared/api/helpers/splitLink.helpers';
import type { ApolloClientOptions } from '@/shared/api/typedefs/apollo.typedefs';

const resolveRefresh = (): Promise<boolean> => Promise.resolve(false);

export const createCache = (): InMemoryCache =>
  new InMemoryCache({
    dataIdFromObject: (object) =>
      typeof object.id === 'string' ? object.id : defaultDataIdFromObject(object),
  });

export const createApolloClient = ({
  config,
  onUnauthenticated = resolveRefresh,
}: ApolloClientOptions): ApolloClient =>
  new ApolloClient({
    cache: createCache(),
    link: ApolloLink.from([
      createErrorLink(onUnauthenticated),
      createAuthLink(),
      createSplitLink(config),
    ]),
  });
