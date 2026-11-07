import { WorkspaceRole } from '@agent-ic/contracts';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { TELEGRAM_LINK_CODE_MAX_ATTEMPTS } from '@/modules/notifications/constants/notification.constants';
import { TelegramLinkCodeUnavailableError } from '@/modules/notifications/errors/telegram-link-code-unavailable.error';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { CreateTelegramNotificationLinkUseCase } from '@/modules/notifications/use-cases/create-telegram-notification-link.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';

type SetLinkCode = (
  workspaceId: string,
  channelId: string,
  linkCodeHash: string,
  linkCodeExpiresAt: Date,
) => Promise<void>;
type TenantRun = (workspaceId: string, work: () => Promise<unknown>) => Promise<unknown>;
type GenerateDigits = (length: number) => string;
type Hash = (value: string) => string;

const LINK_CODE_CONSTRAINT = 'telegram_notification_channels_link_code_hash_key';
const LINK_CODE_CONFLICT = { code: '23505', constraint: LINK_CODE_CONSTRAINT };
const NOW = new Date('2026-09-20T10:00:00.000Z');
const EXPIRES_AT = new Date('2026-09-20T10:10:00.000Z');

const setup = (setTelegramLinkCode: Mock<SetLinkCode>) => {
  const run = vi.fn<TenantRun>((_workspaceId, work) => work());
  const generateDigits = vi
    .fn<GenerateDigits>()
    .mockReturnValueOnce('111111')
    .mockReturnValue('222222');
  const useCase = new CreateTelegramNotificationLinkUseCase(
    { run } as unknown as TenantTransactionService,
    {
      channelIdFor: vi.fn<() => Promise<string>>().mockResolvedValue('channel-1'),
    } as unknown as NotificationSettingsService,
    { setTelegramLinkCode } as unknown as NotificationSettingsRepository,
    {
      generateDigits,
      hash: vi.fn<Hash>((code) => `hash:${code}`),
    } as unknown as SecureTokenService,
    {
      config: { telegram: { alertsBotToken: 'token', alertsBotUsername: 'alerts_bot' } },
    } as unknown as ConfigService,
    { now: () => NOW } as unknown as ClockService,
  );
  return { useCase, run };
};

const ctx = () => workspaceCtx('user-1', 'ws-1', WorkspaceRole.Owner);

describe('CreateTelegramNotificationLinkUseCase', () => {
  it('returns the generated code and its expiry', async () => {
    const setTelegramLinkCode = vi.fn<SetLinkCode>().mockResolvedValue(undefined);
    const { useCase } = setup(setTelegramLinkCode);

    await expect(useCase.execute(ctx())).resolves.toEqual({
      code: '111111',
      botUsername: 'alerts_bot',
      expiresAt: EXPIRES_AT,
    });
    expect(setTelegramLinkCode).toHaveBeenCalledTimes(1);
  });

  it('retries with a new code after a hash conflict', async () => {
    const setTelegramLinkCode = vi
      .fn<SetLinkCode>()
      .mockRejectedValueOnce(LINK_CODE_CONFLICT)
      .mockResolvedValueOnce(undefined);
    const { useCase, run } = setup(setTelegramLinkCode);

    await expect(useCase.execute(ctx())).resolves.toMatchObject({ code: '222222' });
    expect(setTelegramLinkCode).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('rethrows an error that is not a hash conflict', async () => {
    const error = new Error('boom');
    const setTelegramLinkCode = vi.fn<SetLinkCode>().mockRejectedValueOnce(error);
    const { useCase } = setup(setTelegramLinkCode);

    await expect(useCase.execute(ctx())).rejects.toBe(error);
    expect(setTelegramLinkCode).toHaveBeenCalledTimes(1);
  });

  it('gives up after the last attempt', async () => {
    const setTelegramLinkCode = vi.fn<SetLinkCode>().mockRejectedValue(LINK_CODE_CONFLICT);
    const { useCase } = setup(setTelegramLinkCode);

    await expect(useCase.execute(ctx())).rejects.toBeInstanceOf(TelegramLinkCodeUnavailableError);
    expect(setTelegramLinkCode).toHaveBeenCalledTimes(TELEGRAM_LINK_CODE_MAX_ATTEMPTS);
  });
});
