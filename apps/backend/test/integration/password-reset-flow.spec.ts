import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthRoute } from '@/modules/identity/constants/auth-http.constants';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesService } from '@/platform/queues/services/queues.service';
import {
  EXPIRED_COOKIE_DATE,
  FORWARDED_FOR_HEADER,
  SIGN_UP_MUTATION,
} from '@test/support/constants/auth-flow.constants';
import {
  SHORT_PASSWORD,
  TEST_PASSWORD,
  TEST_USER_NAME,
  WAIT_FOR_EMAIL,
} from '@test/support/constants/identity-testing.constants';
import {
  FORGOT_PASSWORD_MUTATION,
  NEW_PASSWORD,
  PASSWORD_RESETS_PER_HOUR,
} from '@test/support/constants/password-reset-testing.constants';
import { EPHEMERAL_PORT, LOOPBACK_HOST } from '@test/support/constants/request-layer.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { randomIpAddress, uniqueEmail } from '@test/support/fixtures/identity.fixture';
import {
  bootRoleWithEmails,
  confirmationTokenIn,
  cookiePair,
  refreshCookieOf,
} from '@test/support/helpers/auth-flow.helpers';
import { passwordResetTokenIn } from '@test/support/helpers/password-reset-testing.helpers';
import { apiPath, graphqlPath } from '@test/support/helpers/request-layer.helpers';

describe('password reset through the api', () => {
  const emails = new FakeEmailGateway();
  let api: INestApplication;
  let worker: INestApplication;

  const http = (): ReturnType<typeof request> => request(api.getHttpServer());

  const authPost = (route: AuthRoute): request.Test =>
    http().post(apiPath(AuthRoute.Base, route)).set(FORWARDED_FOR_HEADER, randomIpAddress());

  const forgotPassword = (email: string): Promise<Response> =>
    http()
      .post(graphqlPath())
      .set(FORWARDED_FOR_HEADER, randomIpAddress())
      .send({ query: FORGOT_PASSWORD_MUTATION, variables: { input: { email } } });

  const signedInAccount = async (): Promise<{ email: string; refreshCookie: string }> => {
    const email = uniqueEmail();
    await http()
      .post(graphqlPath())
      .set(FORWARDED_FOR_HEADER, randomIpAddress())
      .send({
        query: SIGN_UP_MUTATION,
        variables: {
          input: { name: TEST_USER_NAME, email, password: TEST_PASSWORD, locale: Locale.En },
        },
      });
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(1), WAIT_FOR_EMAIL);
    const confirmed = await authPost(AuthRoute.ConfirmEmail).send({
      token: confirmationTokenIn(emails.sentTo(email)[0]?.text ?? ''),
    });
    return {
      email,
      refreshCookie: cookiePair(refreshCookieOf(confirmed.headers[HttpHeader.SetCookie])),
    };
  };

  const resetEmailTo = async (email: string): Promise<string> => {
    await vi.waitFor(() => expect(emails.sentTo(email)).toHaveLength(2), WAIT_FOR_EMAIL);
    return passwordResetTokenIn(emails.sentTo(email)[1]?.text ?? '');
  };

  const login = (email: string, password: string): request.Test =>
    authPost(AuthRoute.Login).send({ email, password });

  beforeAll(async () => {
    api = await bootRoleWithEmails(
      { role: Role.Api, queues: [] },
      emails,
      TestRedisDatabase.PasswordResetFlow,
    );
    worker = await bootRoleWithEmails(
      { role: Role.Worker, queues: [QueueName.Notify] },
      emails,
      TestRedisDatabase.PasswordResetFlow,
    );
    await api.listen(EPHEMERAL_PORT, LOOPBACK_HOST);
  });

  afterAll(async () => {
    await worker.get(QueuesService).get(QueueName.Notify).obliterate({ force: true });
    await worker.close();
    await api.close();
  });

  it('mails a link, resets the password, ends the old session and clears the cookie', async () => {
    const { email, refreshCookie } = await signedInAccount();

    const forgotten = await forgotPassword(email);
    const token = await resetEmailTo(email);
    const reset = await authPost(AuthRoute.ResetPassword).send({ token, password: NEW_PASSWORD });

    expect(forgotten.body.data.forgotPassword).toEqual({ accepted: true });
    expect(reset.status).toBe(204);
    expect(refreshCookieOf(reset.headers[HttpHeader.SetCookie])).toContain(EXPIRED_COOKIE_DATE);
    const staleRefresh = await authPost(AuthRoute.Refresh).set(HttpHeader.Cookie, refreshCookie);
    expect(staleRefresh.status).toBe(401);
    expect((await login(email, TEST_PASSWORD)).status).toBe(401);
    expect((await login(email, NEW_PASSWORD)).status).toBe(200);
  });

  it('refuses a link that was already used, as problem+json', async () => {
    const { email } = await signedInAccount();
    await forgotPassword(email);
    const token = await resetEmailTo(email);
    await authPost(AuthRoute.ResetPassword).send({ token, password: NEW_PASSWORD });

    const again = await authPost(AuthRoute.ResetPassword).send({ token, password: NEW_PASSWORD });

    expect(again.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(again.body).toMatchObject({
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.TokenInvalid,
    });
  });

  it('refuses a password that is too short', async () => {
    const { email } = await signedInAccount();
    await forgotPassword(email);
    const token = await resetEmailTo(email);

    const short = await authPost(AuthRoute.ResetPassword).send({
      token,
      password: SHORT_PASSWORD,
    });

    expect(short.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(short.body.errors).toEqual([{ path: 'password', reason: ErrorReason.PasswordTooShort }]);
  });

  it('answers the same for an unknown address and sends nothing to it', async () => {
    const { email } = await signedInAccount();
    const unknownEmail = uniqueEmail();

    const known = await forgotPassword(email);
    const unknown = await forgotPassword(unknownEmail);

    expect(known.body).toEqual(unknown.body);
    await resetEmailTo(email);
    expect(emails.sentTo(unknownEmail)).toEqual([]);
  });

  it('limits requests per email', async () => {
    const email = uniqueEmail();
    for (let attempt = 0; attempt < PASSWORD_RESETS_PER_HOUR; attempt += 1) {
      await forgotPassword(email);
    }

    const blocked = await forgotPassword(email);

    expect(blocked.body.errors[0].extensions.code).toBe(ErrorCode.LimitReached);
  });
});
