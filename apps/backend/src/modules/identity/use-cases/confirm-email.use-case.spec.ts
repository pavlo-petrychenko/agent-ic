import { WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EMAIL_CONFIRMATION_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { ConfirmationBrowserMismatchError } from '@/modules/identity/errors/confirmation-browser-mismatch.error';
import { EmailAlreadyConfirmedError } from '@/modules/identity/errors/email-already-confirmed.error';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
import { ResetInviteLinkUseCase } from '@/modules/identity/use-cases/reset-invite-link.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createIdentityTestbed,
  issueConfirmationToken,
  readSession,
  readUser,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import {
  activeInviteLinkOf,
  createOwnedWorkspace,
  inviteTokenOf,
  ownerCtx,
  readMemberships,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ConfirmEmailUseCase', () => {
  let testbed: IdentityTestbed;
  let confirmEmail: ConfirmEmailUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    confirmEmail = testbed.module.get(ConfirmEmailUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('confirms the email in the browser that signed up and signs the user in', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    const session = await confirmEmail.execute(anonymousCtx(), {
      token,
      browserBinding: account.browserBinding,
    });

    const user = await readUser(testbed.db, account.userId);
    const claims = await testbed.module.get(AccessTokenService).verify(session.accessToken);
    const stored = await readSession(testbed.db, session.refreshToken);
    expect(user.emailConfirmedAt).toEqual(testbed.clock.now());
    expect(user.lastActiveAt).toEqual(testbed.clock.now());
    expect(user.confirmationBindingHash).toBeNull();
    expect(claims.userId).toBe(account.userId);
    expect(claims.sessionId).toBe(stored.id);
    expect(stored.userId).toBe(account.userId);
    expect(stored.tokenHash).not.toBe(session.refreshToken);
  });

  it('tells a second click on the link that the email is already confirmed', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);
    const input = { token, browserBinding: account.browserBinding };
    await confirmEmail.execute(anonymousCtx(), input);

    const again = confirmEmail.execute(anonymousCtx(), input);

    await expect(again).rejects.toBeInstanceOf(EmailAlreadyConfirmedError);
  });

  it('tells an older unused link that the email is already confirmed', async () => {
    const account = await signUpAccount(testbed);
    const older = await issueConfirmationToken(testbed, account.userId);
    const newer = await issueConfirmationToken(testbed, account.userId);
    await confirmEmail.execute(anonymousCtx(), {
      token: newer,
      browserBinding: account.browserBinding,
    });

    const attempt = confirmEmail.execute(anonymousCtx(), { token: older, browserBinding: null });

    await expect(attempt).rejects.toBeInstanceOf(EmailAlreadyConfirmedError);
  });

  it('keeps a link voided by a newer sign-up invalid', async () => {
    const account = await signUpAccount(testbed);
    const voided = await issueConfirmationToken(testbed, account.userId);
    const again = await signUpAccount(testbed, { email: account.email });

    const attempt = confirmEmail.execute(anonymousCtx(), {
      token: voided,
      browserBinding: again.browserBinding,
    });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('rejects an expired link', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    testbed.clock.advanceBy(
      EMAIL_CONFIRMATION_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );
    const attempt = confirmEmail.execute(anonymousCtx(), {
      token,
      browserBinding: account.browserBinding,
    });

    await expect(attempt).rejects.toBeInstanceOf(TokenExpiredError);
    expect((await readUser(testbed.db, account.userId)).emailConfirmedAt).toBeNull();
  });

  it('rejects a token it never issued', async () => {
    const attempt = confirmEmail.execute(anonymousCtx(), {
      token: 'never-issued',
      browserBinding: null,
    });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('completes a pending invite in the same step', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const link = await activeInviteLinkOf(testbed, workspace.workspaceId);
    const account = await signUpAccount(testbed, {
      inviteToken: await inviteTokenOf(testbed, workspace),
    });

    await confirmEmail.execute(anonymousCtx(), {
      token: await issueConfirmationToken(testbed, account.userId),
      browserBinding: account.browserBinding,
    });

    const membership = (await readMemberships(testbed, workspace.workspaceId)).find(
      (row) => row.userId === account.userId,
    );
    expect(membership).toMatchObject({ role: WorkspaceRole.Operator, inviteLinkId: link.id });
    expect((await readUser(testbed.db, account.userId)).pendingInviteLinkId).toBeNull();
  });

  it('still confirms the email when the pending invite was reset', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const account = await signUpAccount(testbed, {
      inviteToken: await inviteTokenOf(testbed, workspace),
    });
    await testbed.module.get(ResetInviteLinkUseCase).execute(ownerCtx(workspace));

    await confirmEmail.execute(anonymousCtx(), {
      token: await issueConfirmationToken(testbed, account.userId),
      browserBinding: account.browserBinding,
    });

    const user = await readUser(testbed.db, account.userId);
    expect(user.emailConfirmedAt).toEqual(testbed.clock.now());
    expect(user.pendingInviteLinkId).toBeNull();
    expect(await readMemberships(testbed, workspace.workspaceId)).toHaveLength(1);
  });

  it.each([
    { name: 'without the browser cookie', browserBinding: null },
    { name: 'with a cookie from another browser', browserBinding: 'another-browser' },
  ])('refuses to confirm $name and keeps the link usable', async ({ browserBinding }) => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    const attempt = confirmEmail.execute(anonymousCtx(), { token, browserBinding });

    await expect(attempt).rejects.toBeInstanceOf(ConfirmationBrowserMismatchError);
    expect((await readUser(testbed.db, account.userId)).emailConfirmedAt).toBeNull();
    await expect(
      confirmEmail.execute(anonymousCtx(), { token, browserBinding: account.browserBinding }),
    ).resolves.toMatchObject({ userId: account.userId });
  });

  it('refuses the browser of an earlier sign-up for the same email', async () => {
    const first = await signUpAccount(testbed);
    const second = await signUpAccount(testbed, { email: first.email });
    const token = await issueConfirmationToken(testbed, second.userId);

    const attempt = confirmEmail.execute(anonymousCtx(), {
      token,
      browserBinding: first.browserBinding,
    });

    await expect(attempt).rejects.toBeInstanceOf(ConfirmationBrowserMismatchError);
  });

  it('keeps the browser of the sign-up when a new link is resent', async () => {
    const account = await signUpAccount(testbed);
    const before = await readUser(testbed.db, account.userId);

    await testbed.module
      .get(ResendConfirmationUseCase)
      .execute(anonymousCtx(), { email: account.email, token: null });
    const token = await issueConfirmationToken(testbed, account.userId);

    expect((await readUser(testbed.db, account.userId)).confirmationBindingHash).toBe(
      before.confirmationBindingHash,
    );
    await expect(
      confirmEmail.execute(anonymousCtx(), { token, browserBinding: account.browserBinding }),
    ).resolves.toMatchObject({ userId: account.userId });
  });
});
