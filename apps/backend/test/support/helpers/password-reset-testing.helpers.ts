import type { Locale } from '@agent-ic/contracts';
import { eq } from 'drizzle-orm';
import { sessions } from '@/modules/identity/db/sessions.table';
import { PasswordResetsService } from '@/modules/identity/services/password-resets.service';
import type { SessionRecord } from '@/modules/identity/typedefs/session.typedefs';
import { ResetPasswordUseCase } from '@/modules/identity/use-cases/reset-password.use-case';
import { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import {
  NEW_PASSWORD,
  RESET_LINK_PATTERN,
} from '@test/support/constants/password-reset-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  confirmEmail,
  issueConfirmationToken,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import type {
  IdentityTestbed,
  TestAccount,
} from '@test/support/typedefs/identity-testing.typedefs';

export const passwordResetRequestsFor = async (
  testbed: IdentityTestbed,
  userId: string,
): Promise<JobEnvelope[]> => {
  const jobs = await testbed.notifyQueue.getJobs();
  return jobs
    .filter((job) => job.name === NotificationJobName.SendPasswordResetEmail)
    .map((job) => job.data)
    .filter((envelope) => envelope.data['userId'] === userId);
};

export const issuePasswordResetToken = async (
  testbed: IdentityTestbed,
  userId: string,
): Promise<string> => {
  const issued = await testbed.module.get(PasswordResetsService).issueResetToken(userId);
  if (issued === null) {
    throw new MissingTestDataError(userId);
  }
  return issued.token;
};

export const passwordResetTokenIn = (text: string): string => {
  const token = RESET_LINK_PATTERN.exec(text)?.[1];
  if (token === undefined) {
    throw new MissingTestDataError(text);
  }
  return token;
};

export const readSessionsOf = (db: AppDatabase, userId: string): Promise<SessionRecord[]> =>
  db.select().from(sessions).where(eq(sessions.userId, userId));

export const createConfirmedAccountIn = async (
  testbed: IdentityTestbed,
  locale: Locale,
): Promise<TestAccount> => {
  const account = await signUpAccount(testbed, { locale });
  await confirmEmail(
    testbed,
    await issueConfirmationToken(testbed, account.userId),
    account.browserBinding,
  );
  return account;
};

export const resetPassword = (
  testbed: IdentityTestbed,
  token: string,
  password: string = NEW_PASSWORD,
): Promise<void> =>
  testbed.module.get(ResetPasswordUseCase).execute(anonymousCtx(), { token, password });
