import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { ApolloProvider } from '@apollo/client/react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusPage } from '@/features/status';
import { createApolloClient } from '@/shared/api/clients/apollo.client';
import { createSessionClient } from '@/shared/api/clients/session.client';
import { setAccessToken } from '@/shared/api/helpers/requestContext.helpers';
import type { AuthRequest } from '@/shared/api/typedefs/session.typedefs';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import { jsonResponse } from '@test/support/helpers/fetch.helpers';

const GRAPHQL_PATH = '/api/graphql';
const EXPIRES_AT = '2030-01-01T00:00:00.000Z';
const STATUS = { __typename: 'ServerStatus', version: '1.2.3', uptimeSeconds: 60 };
const expiredToken = () =>
  jsonResponse({
    data: null,
    errors: [
      {
        message: 'Access token expired',
        extensions: { code: ErrorCode.Unauthenticated, reason: ErrorReason.InvalidAccessToken },
      },
    ],
  });

const bearerOf = (init: RequestInit | undefined): string | null =>
  new Headers(init?.headers).get('authorization');

describe('an access token that expires mid-session', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it('is refreshed once and the request retried, so the screen never shows an error', async () => {
    const graphql = vi.fn<typeof fetch>((_input, init) =>
      Promise.resolve(
        bearerOf(init) === 'Bearer fresh'
          ? jsonResponse({ data: { serverStatus: STATUS } })
          : expiredToken(),
      ),
    );
    vi.stubGlobal('fetch', graphql);
    const post = vi.fn<AuthRequest>(() =>
      Promise.resolve({ accessToken: 'fresh', accessTokenExpiresAt: EXPIRES_AT }),
    );
    const session = createSessionClient({ post, locks: null, now: () => Date.now() });
    session.start({ accessToken: 'expired', accessTokenExpiresAt: EXPIRES_AT });
    const client = createApolloClient({ config: { graphqlPath: GRAPHQL_PATH }, session });

    render(
      <I18nextProvider i18n={createI18n(Locale.En)}>
        <ApolloProvider client={client}>
          <StatusPage />
        </ApolloProvider>
      </I18nextProvider>,
    );

    expect(await screen.findByText('1.2.3')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    expect(graphql.mock.calls.map(([, init]) => bearerOf(init))).toEqual([
      'Bearer expired',
      'Bearer fresh',
    ]);
  });
});
