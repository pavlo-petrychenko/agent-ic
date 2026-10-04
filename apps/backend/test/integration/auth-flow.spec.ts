import { ErrorCode, ErrorReason, IdPrefix, Locale } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthRoute } from '@/modules/identity/constants/auth-http.constants';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  EXPIRED_COOKIE_DATE,
  FORWARDED_FOR_HEADER,
  ME_QUERY,
  REFRESH_COOKIE_ATTRIBUTES,
  RESEND_CONFIRMATION_MUTATION,
  SIGN_UP_MUTATION,
} from '@test/support/constants/auth-flow.constants';
import {
  TEST_PASSWORD,
  TEST_USER_NAME,
  WAIT_FOR_EMAIL,
} from '@test/support/constants/identity-testing.constants';
import { EPHEMERAL_PORT, LOOPBACK_HOST } from '@test/support/constants/request-layer.constants';
import { randomIpAddress, uniqueEmail } from '@test/support/fixtures/identity.fixture';
import {
  bootRoleWithEmails,
  confirmationTokenIn,
  cookiePair,
  refreshCookieOf,
} from '@test/support/helpers/auth-flow.helpers';
import {
  apiPath,
  graphqlPath,
  queryOverWebSocket,
} from '@test/support/helpers/request-layer.helpers';

const SIGN_UPS_PER_HOUR = 5;

describe('accounts and sessions through the api', () => {
  const emails = new FakeEmailGateway();
  let api: INestApplication;
  let worker: INestApplication;

  const http = (): ReturnType<typeof request> => request(api.getHttpServer());

  const signUp = (email: string, clientIp: string = randomIpAddress()): Promise<Response> =>
    http()
      .post(graphqlPath())
      .set(FORWARDED_FOR_HEADER, clientIp)
      .send({
        query: SIGN_UP_MUTATION,
        variables: {
          input: { name: TEST_USER_NAME, email, password: TEST_PASSWORD, locale: Locale.En },
        },
      });

  const confirmationEmailTo = async (email: string): Promise<string> => {
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(1), WAIT_FOR_EMAIL);
    return confirmationTokenIn(emails.sentTo(email)[0]?.text ?? '');
  };

  const me = (accessToken: string): Promise<Response> =>
    http()
      .post(graphqlPath())
      .set(HttpHeader.Authorization, `Bearer ${accessToken}`)
      .send({ query: ME_QUERY });

  const refresh = (cookie: string): Promise<Response> =>
    http().post(apiPath(AuthRoute.Base, AuthRoute.Refresh)).set(HttpHeader.Cookie, cookie);

  const signedUpAndConfirmed = async (): Promise<{ email: string; response: Response }> => {
    const email = uniqueEmail();
    await signUp(email);
    const token = await confirmationEmailTo(email);
    const response = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.ConfirmEmail))
      .send({ token });
    return { email, response };
  };

  beforeAll(async () => {
    api = await bootRoleWithEmails({ role: Role.Api, queues: [] }, emails);
    worker = await bootRoleWithEmails({ role: Role.Worker, queues: [QueueName.Notify] }, emails);
    await api.listen(EPHEMERAL_PORT, LOOPBACK_HOST);
  });

  afterAll(async () => {
    await worker.get(QueuesService).get(QueueName.Notify).obliterate({ force: true });
    await worker.close();
    await api.close();
  });

  it('signs up, confirms, reads me and rotates the refresh token until it is reused', async () => {
    const { email, response: confirmed } = await signedUpAndConfirmed();

    expect(confirmed.status).toBe(200);
    const firstCookie = refreshCookieOf(confirmed.headers[HttpHeader.SetCookie]);
    for (const attribute of REFRESH_COOKIE_ATTRIBUTES) {
      expect(firstCookie).toContain(attribute);
    }

    const profile = await me(confirmed.body.accessToken);
    expect(profile.body.data.me).toEqual({
      id: expect.stringMatching(new RegExp(`^${IdPrefix.User}_`)),
      email,
      name: TEST_USER_NAME,
      locale: Locale.En,
    });

    const overWebSocket = await queryOverWebSocket(api, ME_QUERY, {
      [ConnectionParam.Authorization]: `Bearer ${confirmed.body.accessToken}`,
    });
    expect(overWebSocket.data?.['me']).toEqual(profile.body.data.me);

    const rotated = await refresh(cookiePair(firstCookie));
    expect(rotated.status).toBe(200);
    const secondCookie = refreshCookieOf(rotated.headers[HttpHeader.SetCookie]);
    expect(cookiePair(secondCookie)).not.toBe(cookiePair(firstCookie));
    expect((await me(rotated.body.accessToken)).body.data.me.email).toBe(email);

    const reused = await refresh(cookiePair(firstCookie));
    expect(reused.status).toBe(401);
    expect(reused.body.reason).toBe(ErrorReason.InvalidRefreshToken);

    const afterReuse = await refresh(cookiePair(secondCookie));
    expect(afterReuse.status).toBe(401);
  });

  it('logs in with a password and logs out', async () => {
    const { email } = await signedUpAndConfirmed();

    const login = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Login))
      .send({ email, password: TEST_PASSWORD });
    const cookie = refreshCookieOf(login.headers[HttpHeader.SetCookie]);
    const logout = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Logout))
      .set(HttpHeader.Cookie, cookiePair(cookie));

    expect(login.status).toBe(200);
    expect(logout.status).toBe(204);
    expect(refreshCookieOf(logout.headers[HttpHeader.SetCookie])).toContain(EXPIRED_COOKIE_DATE);
    expect((await refresh(cookiePair(cookie))).status).toBe(401);
  });

  it('refuses a wrong password as problem+json', async () => {
    const { email } = await signedUpAndConfirmed();

    const login = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Login))
      .send({ email, password: 'not the password' });

    expect(login.status).toBe(401);
    expect(login.body).toMatchObject({
      code: ErrorCode.Unauthenticated,
      reason: ErrorReason.InvalidCredentials,
    });
  });

  it('answers me without a token with UNAUTHENTICATED', async () => {
    const response = await http().post(graphqlPath()).send({ query: ME_QUERY });

    expect(response.body.errors[0].extensions).toMatchObject({
      code: ErrorCode.Unauthenticated,
      reason: ErrorReason.AuthenticationRequired,
    });
  });

  it('resends the confirmation email with the same answer for any address', async () => {
    const email = uniqueEmail();
    await signUp(email);
    await confirmationEmailTo(email);

    const known = await http()
      .post(graphqlPath())
      .send({ query: RESEND_CONFIRMATION_MUTATION, variables: { input: { email } } });
    const unknown = await http()
      .post(graphqlPath())
      .send({
        query: RESEND_CONFIRMATION_MUTATION,
        variables: { input: { email: uniqueEmail() } },
      });

    expect(known.body.data).toEqual(unknown.body.data);
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(2), WAIT_FOR_EMAIL);
  });

  it('limits sign-ups per client address behind the proxy', async () => {
    const clientIp = randomIpAddress();
    for (let attempt = 0; attempt < SIGN_UPS_PER_HOUR; attempt += 1) {
      await signUp(uniqueEmail(), clientIp);
    }

    const blocked = await signUp(uniqueEmail(), clientIp);
    const otherClient = await signUp(uniqueEmail());

    expect(blocked.body.errors[0].extensions.code).toBe(ErrorCode.LimitReached);
    expect(otherClient.body.errors).toBeUndefined();
  });
});
