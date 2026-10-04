import { Test } from '@nestjs/testing';
import { asc, eq } from 'drizzle-orm';
import { sessions } from '@/modules/identity/db/sessions.table';
import { users } from '@/modules/identity/db/users.table';
import { IdentityModule } from '@/modules/identity/identity.module';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { EmailConfirmationsService } from '@/modules/identity/services/email-confirmations.service';
import type { SignUpInput } from '@/modules/identity/typedefs/account.typedefs';
import type { IssuedSession, SessionRecord } from '@/modules/identity/typedefs/session.typedefs';
import type { UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { NotificationJobName } from '@/modules/notifications/constants/notification-job.constants';
import { FakeEmailGateway } from '@/modules/notifications/gateways/email.fake';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ClockModule } from '@/platform/clock/clock.module';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigModule } from '@/platform/config/config.module';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ContextModule } from '@/platform/context/context.module';
import { CryptoModule } from '@/platform/crypto/crypto.module';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { APP_DATABASE } from '@/platform/database/constants/database-token.constants';
import { DatabaseModule } from '@/platform/database/database.module';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';
import { DomainEventsModule } from '@/platform/domain-events/domain-events.module';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueName } from '@/platform/queues/constants/queue.constants';
import { QueuesModule } from '@/platform/queues/queues.module';
import { QueuesService } from '@/platform/queues/services/queues.service';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import { IDENTITY_TEST_START } from '@test/support/constants/identity-testing.constants';
import { TestRedisDatabase } from '@test/support/constants/test-infrastructure.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { anonymousCtx, signUpInput } from '@test/support/fixtures/identity.fixture';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import type {
  IdentityTestbed,
  TestAccount,
} from '@test/support/typedefs/identity-testing.typedefs';

const ROLE = Role.Gateway;

export const createIdentityTestbed = async (): Promise<IdentityTestbed> => {
  const config = loadAppConfig(
    { role: ROLE, queues: [] },
    createIntegrationTestEnv(TestRedisDatabase.Identity),
  );
  const clock = new ManualClock(IDENTITY_TEST_START);
  const emails = new FakeEmailGateway();
  const module = await Test.createTestingModule({
    imports: [
      ConfigModule.register(config),
      ContextModule,
      ErrorsModule,
      DatabaseModule,
      ClockModule,
      IdsModule,
      RedisModule,
      RateLimitModule,
      CryptoModule,
      QueuesModule.forRole(ROLE),
      DomainEventsModule.forRole(ROLE),
      IdentityModule.forRole(ROLE),
      NotificationsModule.forRole(ROLE),
    ],
  })
    .overrideProvider(ClockService)
    .useValue(clock)
    .overrideProvider(EmailGateway)
    .useValue(emails)
    .compile();
  module.useLogger(false);
  await module.init();
  return {
    module,
    clock,
    emails,
    db: module.get<AppDatabase>(APP_DATABASE),
    notifyQueue: module.get(QueuesService).get(QueueName.Notify),
  };
};

export const confirmationRequestsFor = async (
  testbed: IdentityTestbed,
  userId: string,
): Promise<JobEnvelope[]> => {
  const jobs = await testbed.notifyQueue.getJobs();
  return jobs
    .filter((job) => job.name === NotificationJobName.SendConfirmationEmail)
    .map((job) => job.data)
    .filter((envelope) => envelope.data['userId'] === userId);
};

export const findUser = async (testbed: IdentityTestbed, email: string): Promise<UserRecord> => {
  const user = await testbed.module.get(UsersRepository).findByEmail(email);
  if (user === null) {
    throw new MissingTestDataError(email);
  }
  return user;
};

export const issueConfirmationToken = async (
  testbed: IdentityTestbed,
  userId: string,
): Promise<string> => {
  const issued = await testbed.module.get(EmailConfirmationsService).issueConfirmationToken(userId);
  if (issued === null) {
    throw new MissingTestDataError(userId);
  }
  return issued.token;
};

export const signUpAccount = async (
  testbed: IdentityTestbed,
  overrides: Partial<SignUpInput> = {},
): Promise<TestAccount> => {
  const input = signUpInput(overrides);
  await testbed.module.get(SignUpUseCase).execute(anonymousCtx(), input);
  const user = await findUser(testbed, input.email);
  return { userId: user.id, email: input.email, password: input.password };
};

export const confirmEmail = (testbed: IdentityTestbed, token: string): Promise<IssuedSession> =>
  testbed.module.get(ConfirmEmailUseCase).execute(anonymousCtx(), { token });

export const createConfirmedAccount = async (testbed: IdentityTestbed): Promise<TestAccount> => {
  const account = await signUpAccount(testbed);
  await confirmEmail(testbed, await issueConfirmationToken(testbed, account.userId));
  return account;
};

export const readUser = async (db: AppDatabase, userId: string): Promise<UserRecord> => {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (user === undefined) {
    throw new MissingTestDataError(userId);
  }
  return user;
};

export const readSession = async (
  db: AppDatabase,
  refreshToken: string,
): Promise<SessionRecord> => {
  const tokenHash = new SecureTokenService().hash(refreshToken);
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash));
  if (session === undefined) {
    throw new MissingTestDataError(refreshToken);
  }
  return session;
};

export const readSessionFamily = (db: AppDatabase, familyId: string): Promise<SessionRecord[]> =>
  db
    .select()
    .from(sessions)
    .where(eq(sessions.familyId, familyId))
    .orderBy(asc(sessions.createdAt), asc(sessions.id));
