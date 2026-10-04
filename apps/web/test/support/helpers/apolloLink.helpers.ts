import { ApolloClient, type ApolloLink, gql, InMemoryCache } from '@apollo/client';

const PING_QUERY = gql`
  query Ping {
    ping
  }
`;

export const executeThrough = (link: ApolloLink) =>
  new ApolloClient({ cache: new InMemoryCache(), link }).query({
    query: PING_QUERY,
    fetchPolicy: 'no-cache',
  });
