import { WorkspaceRole } from '@agent-ic/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidNotificationEmailError } from '@/modules/notifications/errors/invalid-notification-email.error';
import { notificationEmailVerificationRequestedEvent } from '@/modules/notifications/events/notification-email-verification-requested.event';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { NotificationSettingsView } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { UpdateNotificationEmailUseCase } from '@/modules/notifications/use-cases/update-notification-email.use-case';
import type { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';

const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-08T10:00:00.000Z');

const settingsView = (email: string | null, verifiedAt: Date | null): NotificationSettingsView => ({
  platform: { enabled: true },
  email: { enabled: true, email, verifiedAt },
  telegram: {
    enabled: false,
    linked: false,
    username: null,
    botUsername: null,
    linkedAt: null,
  },
});

describe('UpdateNotificationEmailUseCase', () => {
  const describeSettings = vi.fn<NotificationSettingsService['describe']>();
  const setEmail = vi.fn<NotificationSettingsService['setEmail']>();
  const emit = vi.fn<DomainEventsService['emit']>();
  let useCase: UpdateNotificationEmailUseCase;

  beforeEach(() => {
    describeSettings.mockReset();
    setEmail.mockReset();
    emit.mockReset();
    setEmail.mockImplementation((_workspaceId, _userId, email) =>
      Promise.resolve(settingsView(email, null)),
    );
    useCase = new UpdateNotificationEmailUseCase(
      {
        run: <T>(_workspaceId: string, work: () => Promise<T>): Promise<T> => work(),
      } as unknown as TenantTransactionService,
      {
        describe: describeSettings,
        setEmail,
      } as unknown as NotificationSettingsService,
      { emit } as unknown as DomainEventsService,
    );
  });

  it('stores a new address and requests verification', async () => {
    describeSettings.mockResolvedValue(settingsView(null, null));

    await useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
      email: 'alerts@example.com',
    });

    expect(setEmail).toHaveBeenCalledWith(WORKSPACE_ID, USER_ID, 'alerts@example.com');
    expect(emit).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      notificationEmailVerificationRequestedEvent,
      { workspaceId: WORKSPACE_ID, userId: USER_ID },
      { durable: true },
    );
  });

  it('skips an already verified address', async () => {
    describeSettings.mockResolvedValue(settingsView('alerts@example.com', NOW));

    await expect(
      useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
        email: 'alerts@example.com',
      }),
    ).resolves.toEqual(settingsView('alerts@example.com', NOW));

    expect(setEmail).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('requests verification again for an unverified address', async () => {
    describeSettings.mockResolvedValue(settingsView('alerts@example.com', null));

    await useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
      email: 'alerts@example.com',
    });

    expect(setEmail).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledOnce();
  });

  it('rejects an invalid address before writing', async () => {
    const attempt = useCase.execute(workspaceCtx(USER_ID, WORKSPACE_ID, WorkspaceRole.Owner), {
      email: 'not-an-email',
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidNotificationEmailError);
    expect(setEmail).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });
});
