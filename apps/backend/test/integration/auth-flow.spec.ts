import { ErrorCode, ErrorReason, IdPrefix, Locale } from '@agent-ic/contracts';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AuthRoute,
  CONFIRMATION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/modules/identity/constants/auth-http.constants';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  APP_ORIGIN,
  CROSS_SITE_ORIGIN,
  EXPIRED_COOKIE_DATE,
  FetchSite,
  FORM_CONTENT_TYPE,
  FORWARDED_FOR_HEADER,
  FORWARDED_FOR_SEPARATOR,
  ME_QUERY,
  AUTH_COOKIE_ATTRIBUTES,
  CONFIRMATION_COOKIE_MAX_AGE,
  RESEND_CONFIRMATION_MUTATION,
  TEXT_CONTENT_TYPE,
} from '@test/support/constants/auth-flow.constants';
import {
  TEST_PASSWORD,
  TEST_USER_NAME,
  WAIT_FOR_EMAIL,
} from '@test/support/constants/identity-testing.constants';
import { EPHEMERAL_PORT, LOOPBACK_HOST } from '@test/support/constants/request-layer.constants';
import {
  clusterPodAddress,
  publicIpAddress,
  randomIpAddress,
  uniqueEmail,
} from '@test/support/fixtures/identity.fixture';
import {
  bootRoleWithEmails,
  confirmationCookieOf,
  confirmationTokenIn,
  cookiePair,
  findCookie,
  fromApp,
  refreshCookieOf,
} from '@test/support/helpers/auth-flow.helpers';
import {
  apiPath,
  graphqlPath,
  queryOverWebSocket,
} from '@test/support/helpers/request-layer.helpers';

const SIGN_UPS_PER_HOUR = 5;
const ATTACKER_PASSWORD = 'attacker chosen password';

describe('accounts and sessions through the api', () => {
  const emails = new FakeEmailGateway();
  let api: INestApplication;
  let worker: INestApplication;

  const http = (): ReturnType<typeof request> => request(api.getHttpServer());

  const authPost = (route: AuthRoute): ReturnType<ReturnType<typeof request>['post']> =>
    fromApp(http().post(apiPath(AuthRoute.Base, route)));

  const signUp = (
    email: string,
    clientIp: string = randomIpAddress(),
    password: string = TEST_PASSWORD,
  ): Promise<Response> =>
    authPost(AuthRoute.SignUp)
      .set(FORWARDED_FOR_HEADER, clientIp)
      .send({ name: TEST_USER_NAME, email, password, locale: Locale.En });

  const signUpInBrowser = async (email: string, password?: string): Promise<string> => {
    const response = await signUp(email, randomIpAddress(), password);
    expect(response.status).toBe(200);
    return cookiePair(confirmationCookieOf(response.headers[HttpHeader.SetCookie]));
  };

  const confirmationEmailsTo = async (email: string, count: number): Promise<string> => {
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(count), WAIT_FOR_EMAIL);
    return confirmationTokenIn(emails.sentTo(email)[count - 1]?.text ?? '');
  };

  const confirmationEmailTo = (email: string): Promise<string> => confirmationEmailsTo(email, 1);

  const confirm = (token: string, browserCookie: string | null): Promise<Response> => {
    const pending = authPost(AuthRoute.ConfirmEmail);
    return (browserCookie === null ? pending : pending.set(HttpHeader.Cookie, browserCookie)).send({
      token,
    });
  };

  const resendTo = (email: string): Promise<Response> =>
    http()
      .post(graphqlPath())
      .send({ query: RESEND_CONFIRMATION_MUTATION, variables: { input: { email } } });

  const login = (email: string, password: string): Promise<Response> =>
    authPost(AuthRoute.Login).send({ email, password });

  const me = (accessToken: string): Promise<Response> =>
    http()
      .post(graphqlPath())
      .set(HttpHeader.Authorization, `Bearer ${accessToken}`)
      .send({ query: ME_QUERY });

  const refresh = (cookie: string): Promise<Response> =>
    authPost(AuthRoute.Refresh).set(HttpHeader.Cookie, cookie);

  const signedUpAndConfirmed = async (): Promise<{ email: string; response: Response }> => {
    const email = uniqueEmail();
    const browserCookie = await signUpInBrowser(email);
    const token = await confirmationEmailTo(email);
    const response = await confirm(token, browserCookie);
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
    for (const attribute of AUTH_COOKIE_ATTRIBUTES) {
      expect(firstCookie).toContain(attribute);
    }
    const releasedBinding = findCookie(
      confirmed.headers[HttpHeader.SetCookie],
      CONFIRMATION_COOKIE_NAME,
    );
    expect(releasedBinding).toContain(EXPIRED_COOKIE_DATE);

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
    const clearedOnReuse = refreshCookieOf(reused.headers[HttpHeader.SetCookie]);
    expect(clearedOnReuse).toContain(EXPIRED_COOKIE_DATE);
    for (const attribute of AUTH_COOKIE_ATTRIBUTES) {
      expect(clearedOnReuse).toContain(attribute);
    }

    const afterReuse = await refresh(cookiePair(secondCookie));
    expect(afterReuse.status).toBe(401);
  });

  it('signs up over REST with a browser cookie and no session', async () => {
    const email = uniqueEmail();

    const response = await signUp(email);

    const binding = confirmationCookieOf(response.headers[HttpHeader.SetCookie]);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ email });
    for (const attribute of [...AUTH_COOKIE_ATTRIBUTES, CONFIRMATION_COOKIE_MAX_AGE]) {
      expect(binding).toContain(attribute);
    }
    expect(findCookie(response.headers[HttpHeader.SetCookie], REFRESH_COOKIE_NAME)).toBeNull();
  });

  it('answers a second confirmation with EMAIL_ALREADY_CONFIRMED', async () => {
    const email = uniqueEmail();
    const browserCookie = await signUpInBrowser(email);
    const token = await confirmationEmailTo(email);
    await confirm(token, browserCookie);

    const again = await confirm(token, browserCookie);

    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({
      code: ErrorCode.Conflict,
      reason: ErrorReason.EmailAlreadyConfirmed,
    });
  });

  it('refuses a sign-up from another origin', async () => {
    const response = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.SignUp))
      .set(HttpHeader.Origin, CROSS_SITE_ORIGIN)
      .send({ name: TEST_USER_NAME, email: uniqueEmail(), password: TEST_PASSWORD });

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe(ErrorReason.CrossOriginRequest);
  });

  it.each([
    { name: 'without the browser cookie', cookie: () => null },
    { name: 'with a wrong browser cookie', cookie: () => `${CONFIRMATION_COOKIE_NAME}=forged` },
  ])('refuses to confirm $name', async ({ cookie }) => {
    const email = uniqueEmail();
    await signUpInBrowser(email);
    const token = await confirmationEmailTo(email);

    const refused = await confirm(token, cookie());

    expect(refused.status).toBe(403);
    expect(refused.body.reason).toBe(ErrorReason.ConfirmationBrowserMismatch);
    expect(refused.headers[HttpHeader.SetCookie]).toBeUndefined();
  });

  it('keeps an unconfirmed sign-up taken over by someone else from being confirmed', async () => {
    const email = uniqueEmail();
    const ownerBrowser = await signUpInBrowser(email);
    const ownerToken = await confirmationEmailsTo(email, 1);

    await signUpInBrowser(email, ATTACKER_PASSWORD);
    const tokenFromAttackerSignUp = await confirmationEmailsTo(email, 2);

    const firstLink = await confirm(ownerToken, ownerBrowser);
    const latestLink = await confirm(tokenFromAttackerSignUp, ownerBrowser);
    expect(firstLink.body.reason).toBe(ErrorReason.TokenInvalid);
    expect(latestLink.status).toBe(403);
    expect(latestLink.body.reason).toBe(ErrorReason.ConfirmationBrowserMismatch);

    await resendTo(email);
    const resentToken = await confirmationEmailsTo(email, 3);
    const afterResend = await confirm(resentToken, ownerBrowser);
    expect(afterResend.status).toBe(403);
    expect(afterResend.body.reason).toBe(ErrorReason.ConfirmationBrowserMismatch);

    const ownerBrowserAgain = await signUpInBrowser(email);
    const ownerSignUpToken = await confirmationEmailsTo(email, 4);
    const confirmed = await confirm(ownerSignUpToken, ownerBrowserAgain);
    expect(confirmed.status).toBe(200);

    expect((await login(email, TEST_PASSWORD)).status).toBe(200);
    expect((await login(email, ATTACKER_PASSWORD)).status).toBe(401);
  });

  it('clears the refresh cookie when a refresh fails', async () => {
    const unknown = await refresh(`${REFRESH_COOKIE_NAME}=never-issued`);
    const missing = await authPost(AuthRoute.Refresh);

    for (const failed of [unknown, missing]) {
      expect(failed.status).toBe(401);
      expect(failed.body.reason).toBe(ErrorReason.InvalidRefreshToken);
      expect(refreshCookieOf(failed.headers[HttpHeader.SetCookie])).toContain(EXPIRED_COOKIE_DATE);
    }
  });

  it('logs in with a password and logs out', async () => {
    const { email } = await signedUpAndConfirmed();

    const signedIn = await login(email, TEST_PASSWORD);
    const cookie = refreshCookieOf(signedIn.headers[HttpHeader.SetCookie]);
    const logout = await authPost(AuthRoute.Logout).set(HttpHeader.Cookie, cookiePair(cookie));

    expect(signedIn.status).toBe(200);
    expect(logout.status).toBe(204);
    expect(refreshCookieOf(logout.headers[HttpHeader.SetCookie])).toContain(EXPIRED_COOKIE_DATE);
    expect((await refresh(cookiePair(cookie))).status).toBe(401);
  });

  it('refuses a wrong password as problem+json', async () => {
    const { email } = await signedUpAndConfirmed();

    const refused = await login(email, 'not the password');

    expect(refused.status).toBe(401);
    expect(refused.body).toMatchObject({
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

    const known = await resendTo(email);
    const unknown = await resendTo(uniqueEmail());

    expect(known.body.data).toEqual(unknown.body.data);
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(2), WAIT_FOR_EMAIL);
  });

  it('limits sign-ups per client address behind cloudflared and traefik', async () => {
    const clientIp = publicIpAddress();
    const forwardedFor = (): string =>
      [randomIpAddress(), clientIp, clusterPodAddress()].join(FORWARDED_FOR_SEPARATOR);
    for (let attempt = 0; attempt < SIGN_UPS_PER_HOUR; attempt += 1) {
      await signUp(uniqueEmail(), forwardedFor());
    }

    const blocked = await signUp(uniqueEmail(), forwardedFor());
    const otherClient = await signUp(
      uniqueEmail(),
      [publicIpAddress(), clusterPodAddress()].join(FORWARDED_FOR_SEPARATOR),
    );

    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe(ErrorCode.LimitReached);
    expect(otherClient.status).toBe(200);
  });

  it('refuses an auth request from another origin', async () => {
    const { email } = await signedUpAndConfirmed();

    const login = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Login))
      .set(HttpHeader.Origin, CROSS_SITE_ORIGIN)
      .send({ email, password: TEST_PASSWORD });

    expect(login.status).toBe(403);
    expect(login.body.reason).toBe(ErrorReason.CrossOriginRequest);
    expect(login.headers[HttpHeader.SetCookie]).toBeUndefined();
  });

  it.each([
    { name: 'no origin headers', headers: {} },
    { name: 'a cross-site fetch', headers: { [HttpHeader.SecFetchSite]: FetchSite.CrossSite } },
  ])('refuses an auth request with $name', async ({ headers }) => {
    const response = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Login))
      .set(headers)
      .send({ email: uniqueEmail(), password: TEST_PASSWORD });

    expect(response.status).toBe(403);
    expect(response.body.reason).toBe(ErrorReason.CrossOriginRequest);
  });

  it('accepts a same-origin fetch that sends no origin header', async () => {
    const { email } = await signedUpAndConfirmed();

    const login = await http()
      .post(apiPath(AuthRoute.Base, AuthRoute.Login))
      .set(HttpHeader.SecFetchSite, FetchSite.SameOrigin)
      .send({ email, password: TEST_PASSWORD });

    expect(login.status).toBe(200);
  });

  it.each([FORM_CONTENT_TYPE, TEXT_CONTENT_TYPE])(
    'refuses an auth request sent as %s',
    async (contentType) => {
      const { email } = await signedUpAndConfirmed();

      const login = await http()
        .post(apiPath(AuthRoute.Base, AuthRoute.Login))
        .set(HttpHeader.Origin, APP_ORIGIN)
        .set(HttpHeader.ContentType, contentType)
        .send(new URLSearchParams({ email, password: TEST_PASSWORD }).toString());

      expect(login.status).toBe(415);
      expect(login.body.reason).toBe(ErrorReason.UnsupportedContentType);
      expect(login.headers[HttpHeader.SetCookie]).toBeUndefined();
    },
  );
});
