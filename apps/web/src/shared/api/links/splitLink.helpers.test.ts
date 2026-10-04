import { gql } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { buildWebSocketUrl, isSubscriptionOperation } from '@/shared/api/links/splitLink.helpers';

const PATH = '/api/graphql';
const HOST = 'app.example.com';

describe('buildWebSocketUrl', () => {
  it('uses wss when the page is served over https', () => {
    expect(buildWebSocketUrl(PATH, { protocol: 'https:', host: HOST })).toBe(
      `wss://${HOST}${PATH}`,
    );
  });

  it('uses ws when the page is served over http', () => {
    expect(buildWebSocketUrl(PATH, { protocol: 'http:', host: HOST })).toBe(`ws://${HOST}${PATH}`);
  });
});

describe('isSubscriptionOperation', () => {
  it('is true only for subscriptions', () => {
    const subscription = gql`
      subscription Changed {
        changed
      }
    `;
    const query = gql`
      query Read {
        read
      }
    `;

    expect(isSubscriptionOperation(subscription)).toBe(true);
    expect(isSubscriptionOperation(query)).toBe(false);
  });
});
