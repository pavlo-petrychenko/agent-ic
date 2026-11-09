import { WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationEmailVerificationExpiredError } from '@/modules/notifications/errors/notification-email-verification-expired.error';
import { NotificationEmailVerificationInvalidError } from '@/modules/notifications/errors/notification-email-verification-invalid.error';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { NotificationSettingsView } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { VerifyNotificationEmailUseCase } from '@/modules/notifications/use-cases/verify-notification-email.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-08T10:00:00.000Z');

const settingsView = (verifiedAt: Date | null): NotificationSettingsView => ({
  platform: { enabled: true },
  email: { enabled: true, email: 'alerts@example.com', verifiedAt },
  telegram: {
    enabled: false,
    linked: false,
    username: null,
    botUsername: null,
    linkedAt: null,
  },
});

describe('VerifyNotificationEmailUseCase', () => {
  const findEmailVerification = vi.fn<NotificationSettingsRepository['findEmailVerification']>();
  const markEmailVerified = vi.fn<NotificationSettingsRepository['markEmailVerified']>();
  const describeSettings = vi.fn<NotificationSettingsService['describe']>();
  const hash = vi.fn<SecureTokenService['hash']>();
  let useCase: VerifyNotificationEmailUseCase;

  beforeEach(() => {
    findEmailVerification.mockReset();
    markEmailVerified.mockReset();
    describeSettings.mockReset();
    hash.mockReset();
    hash.mockReturnValue('token-hash');
    useCase = new VerifyNotificationEmailUseCase(
      {
        run: <T>(_workspaceId: string, work: () => Promise<T>): Promise<T> => work(),
      } as unknown as TenantTransactionService,
      { describe: describeSettings } as unknown as NotificationSettingsService,
      {
        findEmailVerification,
        markEmailVerified,
      } as unknown as NotificationSettingsRepository,
      { hash } as unknown as SecureTokenService,
      { now: () => NOW } as unknown as ClockService,
    );
  });

  it('marks the current address verified and clears the token', async () => {
    findEmailVerification.mockResolvedValue({
      channelId: 'channel-1',
      email: 'alerts@example.com',
      verificationExpiresAt: new Date('2026-11-09T10:00:00.000Z'),
      verifiedAt: null,
    });
    markEmailVerified.mockResolvedValue(true);
    describeSettings.mockResolvedValue(settingsView(NOW));

    await expect(
      useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
        token: 'raw-token',
      }),
    ).resolves.toEqual(settingsView(NOW));

    expect(findEmailVerification).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID, 'token-hash');
    expect(markEmailVerified).toHaveBeenCalledWith(WORKSPACE_ID, 'channel-1', 'token-hash', NOW);
  });

  it('rejects a token that is not current', async () => {
    findEmailVerification.mockResolvedValue(null);

    await expect(
      useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
        token: 'raw-token',
      }),
    ).rejects.toBeInstanceOf(NotificationEmailVerificationInvalidError);

    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    findEmailVerification.mockResolvedValue({
      channelId: 'channel-1',
      email: 'alerts@example.com',
      verificationExpiresAt: NOW,
      verifiedAt: null,
    });

    await expect(
      useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
        token: 'raw-token',
      }),
    ).rejects.toBeInstanceOf(NotificationEmailVerificationExpiredError);

    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it('rejects an empty token before reading the database', async () => {
    const attempt = useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
      token: ' ',
    });

    await expect(attempt).rejects.toBeInstanceOf(NotificationEmailVerificationInvalidError);
    expect(findEmailVerification).not.toHaveBeenCalled();
  });
});
