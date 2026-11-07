import { describe, expect, it, vi, type Mock } from 'vitest';
import { TelegramLinkRepository } from '@/modules/notifications/repositories/telegram-link.repository';
import { ClearExpiredTelegramLinksUseCase } from '@/modules/notifications/use-cases/clear-expired-telegram-links.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { userCtx, systemCtx } from '@test/support/fixtures/identity.fixture';

type ClearExpired = () => Promise<number>;

const createUseCase = (clearExpired: Mock<ClearExpired>) =>
  new ClearExpiredTelegramLinksUseCase({ clearExpired } as unknown as TelegramLinkRepository);

describe('ClearExpiredTelegramLinksUseCase', () => {
  it('runs only as the system actor', async () => {
    const clearExpired = vi.fn<ClearExpired>();
    const useCase = createUseCase(clearExpired);

    await expect(useCase.execute(userCtx('user-1'))).rejects.toBeInstanceOf(
      SystemActorRequiredError,
    );
    expect(clearExpired).not.toHaveBeenCalled();
  });

  it('clears the expired link codes', async () => {
    const clearExpired = vi.fn<ClearExpired>().mockResolvedValue(3);
    const useCase = createUseCase(clearExpired);

    await expect(useCase.execute(systemCtx())).resolves.toBe(3);
    expect(clearExpired).toHaveBeenCalledTimes(1);
  });
});
