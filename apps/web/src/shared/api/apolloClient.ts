import { ApolloClient, ApolloLink, defaultDataIdFromObject, InMemoryCache } from '@apollo/client';
import type { ApolloClientOptions } from '@/shared/api/api.typedefs';
import { createAuthLink } from '@/shared/api/links/authLink';
import { createErrorLink } from '@/shared/api/links/errorLink';
import { createSplitLink } from '@/shared/api/links/splitLink';

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
