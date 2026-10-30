import { describe, expect, it, vi } from 'vitest';
import { TelegramTokenHealthService } from '@/modules/channels/services/telegram-token-health.service';
import type { TelegramTokenHealthResult } from '@/modules/channels/typedefs/telegram.typedefs';
import { CheckTelegramTokenHealthUseCase } from '@/modules/channels/use-cases/check-telegram-token-health.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { workspaceSystemCtx } from '@test/support/fixtures/conversation.fixture';
import { userCtx } from '@test/support/fixtures/identity.fixture';

const checkConnectedMock = () => vi.fn<() => Promise<TelegramTokenHealthResult>>();

describe('CheckTelegramTokenHealthUseCase', () => {
  it('runs only as the system', async () => {
    const checkConnected = checkConnectedMock();
    const useCase = new CheckTelegramTokenHealthUseCase({
      checkConnected,
    } as unknown as TelegramTokenHealthService);

    await expect(useCase.execute(userCtx('user-1'))).rejects.toBeInstanceOf(
      SystemActorRequiredError,
    );
    expect(checkConnected).not.toHaveBeenCalled();
  });

  it('delegates to the token health service', async () => {
    const checkConnected = checkConnectedMock().mockResolvedValue({ checked: 2, broken: 1 });
    const useCase = new CheckTelegramTokenHealthUseCase({
      checkConnected,
    } as unknown as TelegramTokenHealthService);

    await expect(useCase.execute(workspaceSystemCtx('ws-1'))).resolves.toEqual({
      checked: 2,
      broken: 1,
    });
  });
});
