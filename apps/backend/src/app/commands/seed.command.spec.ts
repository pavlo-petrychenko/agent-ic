import { NestFactory } from '@nestjs/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeedCommand } from '@/app/commands/seed.command';
import { SEED_PRODUCTION_MESSAGE } from '@/app/constants/seed.constants';
import { EnvVar, NodeEnvironment } from '@/platform/config/constants/env.constants';
import { ConfigError } from '@/platform/config/errors/config.error';
import { TEST_ENV } from '@test/support/constants/test-env.constants';

const appModuleLoaded = vi.hoisted(() => vi.fn<() => void>());

vi.mock('@/app/app.module', () => {
  appModuleLoaded();
  return { AppModule: { forRole: vi.fn<() => void>() } };
});

class ExposedSeedCommand extends SeedCommand {
  runSeed(): Promise<void> {
    return this.run();
  }
}

describe('SeedCommand', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    appModuleLoaded.mockClear();
  });

  it('refuses to run in production before loading the application', async () => {
    for (const [name, value] of Object.entries(TEST_ENV)) {
      vi.stubEnv(name, value);
    }
    vi.stubEnv(EnvVar.NodeEnv, NodeEnvironment.Production);
    const createContext = vi.spyOn(NestFactory, 'createApplicationContext');

    const outcome = new ExposedSeedCommand().runSeed();

    await expect(outcome).rejects.toBeInstanceOf(ConfigError);
    await expect(outcome).rejects.toThrow(SEED_PRODUCTION_MESSAGE);
    expect(appModuleLoaded).not.toHaveBeenCalled();
    expect(createContext).not.toHaveBeenCalled();
  });
});
