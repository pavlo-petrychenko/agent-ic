import { Locale } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository, WorkspacesRepository } from '@/modules/identity';
import { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { SendNotificationEmailVerificationUseCase } from '@/modules/notifications/use-cases/send-notification-email-verification.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { systemCtx } from '@test/support/fixtures/identity.fixture';

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-08T10:00:00.000Z');
const EXPIRES_AT = new Date('2026-11-09T10:00:00.000Z');

type User = NonNullable<Awaited<ReturnType<UsersRepository['findById']>>>;
type Workspace = NonNullable<Awaited<ReturnType<WorkspacesRepository['findById']>>>;

const userCtx = (): UseCaseCtx => ({
  ...systemCtx(),
  initiatedBy: { kind: ActorKind.User, userId: USER_ID },
});

describe('SendNotificationEmailVerificationUseCase', () => {
  const channelIdFor = vi.fn<NotificationSettingsService['channelIdFor']>();
  const describeSettings = vi.fn<NotificationSettingsService['describe']>();
  const setEmailVerificationToken =
    vi.fn<NotificationSettingsRepository['setEmailVerificationToken']>();
  const findUser = vi.fn<UsersRepository['findById']>();
  const findWorkspace = vi.fn<WorkspacesRepository['findById']>();
  const send = vi.fn<EmailGateway['send']>();
  const generate = vi.fn<SecureTokenService['generate']>();
  const toPublic = vi.fn<IdService['toPublic']>();
  let useCase: SendNotificationEmailVerificationUseCase;

  beforeEach(() => {
    channelIdFor.mockReset();
    describeSettings.mockReset();
    setEmailVerificationToken.mockReset();
    findUser.mockReset();
    findWorkspace.mockReset();
    send.mockReset();
    generate.mockReset();
    toPublic.mockReset();
    channelIdFor.mockResolvedValue('channel-1');
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: true, email: 'alerts@example.com', verifiedAt: null },
      telegram: {
        enabled: false,
        linked: false,
        username: null,
        botUsername: null,
        linkedAt: null,
      },
    });
    setEmailVerificationToken.mockResolvedValue(true);
    findUser.mockResolvedValue({
      id: USER_ID,
      name: 'Demo Owner',
      email: 'owner@example.com',
      locale: Locale.En,
    } as unknown as User);
    findWorkspace.mockResolvedValue({ name: 'Kavarnia Lviv' } as unknown as Workspace);
    generate.mockReturnValue({ token: 'raw-token', hash: 'token-hash' });
    toPublic.mockReturnValue('ws_public');
    useCase = new SendNotificationEmailVerificationUseCase(
      {
        run: <T>(_workspaceId: string, work: () => Promise<T>): Promise<T> => work(),
      } as unknown as TenantTransactionService,
      { channelIdFor, describe: describeSettings } as unknown as NotificationSettingsService,
      { setEmailVerificationToken } as unknown as NotificationSettingsRepository,
      { findById: findUser } as unknown as UsersRepository,
      { findById: findWorkspace } as unknown as WorkspacesRepository,
      { send } as unknown as EmailGateway,
      {
        config: { publicUrl: 'https://app.agent-ic.test' },
      } as unknown as ConfigService,
      { now: () => NOW } as unknown as ClockService,
      { generate } as unknown as SecureTokenService,
      { toPublic } as unknown as IdService,
    );
  });

  it('stores a token and emails the current alert address', async () => {
    await useCase.execute(userCtx(), { workspaceId: WORKSPACE_ID, userId: USER_ID });

    expect(setEmailVerificationToken).toHaveBeenCalledWith(
      WORKSPACE_ID,
      'channel-1',
      'token-hash',
      EXPIRES_AT,
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: EmailTemplate.NotificationEmailVerification,
        to: 'alerts@example.com',
        subject: 'Verify your alert email for Kavarnia Lviv',
        text: expect.stringContaining('alerts@example.com'),
        html: expect.stringContaining(
          'https://app.agent-ic.test/w/ws_public/settings/notifications?verifyEmail=raw-token',
        ),
      }),
    );
  });

  it('does nothing when the address is already verified', async () => {
    describeSettings.mockResolvedValue({
      platform: { enabled: true },
      email: { enabled: true, email: 'alerts@example.com', verifiedAt: NOW },
      telegram: {
        enabled: false,
        linked: false,
        username: null,
        botUsername: null,
        linkedAt: null,
      },
    });

    await useCase.execute(userCtx(), { workspaceId: WORKSPACE_ID, userId: USER_ID });

    expect(setEmailVerificationToken).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('does nothing when the originator is another user', async () => {
    const ctx = {
      ...userCtx(),
      initiatedBy: { kind: ActorKind.User, userId: 'other-user' },
    } as UseCaseCtx;

    await useCase.execute(ctx, { workspaceId: WORKSPACE_ID, userId: USER_ID });

    expect(setEmailVerificationToken).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('refuses a non-system actor', async () => {
    const attempt = useCase.execute(
      { ...userCtx(), actor: { kind: ActorKind.User, userId: USER_ID } },
      { workspaceId: WORKSPACE_ID, userId: USER_ID },
    );

    await expect(attempt).rejects.toBeInstanceOf(SystemActorRequiredError);
    expect(send).not.toHaveBeenCalled();
  });
});
